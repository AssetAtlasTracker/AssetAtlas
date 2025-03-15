import os
import subprocess
import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import threading
import time
import sys

# Add parent directory to path to import envWriter
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from envWriter import set_env_variable

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(SCRIPT_DIR, ".env")

def save_auth_key():
    auth_key = auth_key_entry.get()
    if not auth_key:
        messagebox.showwarning("Input Error", "Please enter a Tailscale auth key")
        return
    try:
        # Save to .env file
        set_env_variable("TS_AUTH_KEY", auth_key, ENV_PATH)
        messagebox.showinfo("Success", "Tailscale Auth Key saved")
    except Exception as e:
        messagebox.showerror("Error", f"Failed to save Tailscale Auth Key: {e}")

def show_url_popup(url):
    popup = tk.Toplevel()
    popup.title("Service Running")
    tk.Label(popup, text="Service is running at:").pack(pady=5)
    url_entry = tk.Entry(popup, width=50)
    url_entry.pack(pady=5, padx=10)
    url_entry.insert(0, url)
    url_entry.config(state='readonly')
    url_entry.configure(state='normal')
    url_entry.select_range(0, 'end')
    url_entry.focus()
    url_entry.configure(state='readonly')
    
    def copy_to_clipboard():
        popup.clipboard_clear()
        popup.clipboard_append(url)
    
    copy_button = tk.Button(popup, text="Copy URL", command=copy_to_clipboard)
    copy_button.pack(pady=5)
    ok_button = tk.Button(popup, text="OK", command=popup.destroy)
    ok_button.pack(pady=5)
    popup.grab_set()
    popup.focus_set()
    popup.transient(root)

def shutdown_docker_thread():
    shutdown_button.config(state=tk.DISABLED)
    thread = threading.Thread(target=shutdown_docker)
    thread.start()

def shutdown_docker():
    try:
        # Use docker-compose down to stop and remove all containers
        compose_local = os.path.join(SCRIPT_DIR, "docker-compose-local.yml")
        compose_tailscale = os.path.join(SCRIPT_DIR, "docker-compose-tailscale.yml")
        
        subprocess.run(["docker-compose", "-f", compose_local, "down"], 
                      stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=SCRIPT_DIR)
        subprocess.run(["docker-compose", "-f", compose_tailscale, "down"], 
                      stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd=SCRIPT_DIR)
        
        shutdown_button.config(state=tk.NORMAL)
        label_status.config(text="Docker containers stopped")
    except Exception as e:
        shutdown_button.config(state=tk.NORMAL)
        messagebox.showerror("Error", f"Unexpected error: {e}")

def on_closing():
    if messagebox.askyesno("Quit", "Do you want to shut down the Docker containers before exiting?"):
        shutdown_docker()
    root.destroy()

def run_docker_thread(mode):
    run_button.config(state=tk.DISABLED)
    thread = threading.Thread(target=run_docker, args=(mode,))
    thread.start()

def run_docker(mode):
    progressbar = ttk.Progressbar(mode="indeterminate", length=250)
    progressbar.grid(row=5, column=1, padx=10)
    progressbar.start()
    try:
        # First stop any running containers
        shutdown_docker()
        
        # Ensure the .env file exists
        if not os.path.exists(ENV_PATH):
            with open(ENV_PATH, "w") as f:
                f.write("IP=localhost:3000\n")
                f.write("TS_AUTH_KEY=\n")
                
        if mode == "local":
            # Update .env with local settings
            set_env_variable("IP", "localhost:3000", ENV_PATH)
            
            # Use docker-compose with the local compose file
            compose_file = os.path.join(SCRIPT_DIR, "docker-compose-local.yml")
            command = ["docker-compose", "-f", compose_file, "up", "-d"]
            url = "http://localhost:3000"
            
        else:  # tailscale mode
            # Get the Tailscale auth key
            try:
                with open(ENV_PATH, 'r') as f:
                    env_content = f.read()
                    auth_key = ""
                    for line in env_content.splitlines():
                        if line.startswith("TS_AUTH_KEY="):
                            auth_key = line.split("=", 1)[1].strip()
                
                if not auth_key:
                    progressbar.stop()
                    run_button.config(state=tk.NORMAL)
                    messagebox.showerror("Error", "Tailscale auth key not found. Please save it first.")
                    return
                
            except Exception as e:
                progressbar.stop()
                run_button.config(state=tk.NORMAL)
                messagebox.showerror("Error", f"Could not read Tailscale auth key: {e}")
                return
                
            # Set environment variable for docker-compose
            os.environ["TS_AUTH_KEY"] = auth_key
            
            # Use docker-compose with the tailscale compose file
            compose_file = os.path.join(SCRIPT_DIR, "docker-compose-tailscale.yml")
            command = ["docker-compose", "-f", compose_file, "up", "-d"]
        
        # Run docker-compose command
        subprocess.run(command, check=True, cwd=SCRIPT_DIR)
        
        # For Tailscale mode, we need to get the IP
        if mode == "tailscale":
            max_attempts = 20
            tailscale_ip = None
            
            # Wait a bit for container to start
            time.sleep(5)
            
            for attempt in range(max_attempts):
                try:
                    print(f"Attempt {attempt + 1} to get Tailscale IP...")
                    # Use the tailscale container, not the assetatlas container
                    tailscale_ip = subprocess.check_output(
                        ["docker", "exec", "tailscale", "tailscale", "ip", "-4"]
                    ).decode().strip()
                    if tailscale_ip:
                        print(f"Found Tailscale IP: {tailscale_ip}")
                        # Set the IP environment variable only, no TAILSCALE_IP
                        set_env_variable("IP", tailscale_ip + ":3000", ENV_PATH)
                        os.environ["IP"] = tailscale_ip + ":3000"
                        
                        # Update the assetatlas container to use the new IP
                        compose_cmd = ["docker-compose", "-f", compose_file, "up", "-d", "--force-recreate", "assetatlas"]
                        subprocess.run(compose_cmd, check=True, cwd=SCRIPT_DIR)
                        break
                except subprocess.CalledProcessError:
                    print(f"Attempt {attempt + 1} failed")
                time.sleep(3)
                
            if not tailscale_ip:
                progressbar.stop()
                run_button.config(state=tk.NORMAL)
                messagebox.showerror("Error", "Failed to get Tailscale IP after multiple attempts")
                return
                
            url = f"http://{tailscale_ip}:3000"
        
        show_url_popup(url)
        print(f"Service is running at {url}")
        progressbar.stop()
        label_status.config(text=f"Docker containers started ({url})")
        run_button.config(state=tk.NORMAL)
    
    except Exception as e:
        progressbar.stop()
        run_button.config(state=tk.NORMAL)
        messagebox.showerror("Error", f"Error running Docker container: {e}")

root = tk.Tk()
root.title("AssetAtlas Simple Launcher")
root.protocol("WM_DELETE_WINDOW", on_closing)

tk.Label(root, text="Tailscale Auth Key:").grid(row=0, column=0, padx=10, pady=10)
auth_key_entry = tk.Entry(root, width=40)
auth_key_entry.grid(row=0, column=1, padx=10, pady=10)

save_key_button = tk.Button(root, text="Save Auth Key", command=save_auth_key)
save_key_button.grid(row=1, columnspan=2, padx=10, pady=10)

mode_var = tk.StringVar(value="local")

tk.Label(root, text="Select Mode:").grid(row=2, column=0, padx=10, pady=10)
local_mode_radio = tk.Radiobutton(root, text="Local Mode (localhost)", variable=mode_var, value="local")
local_mode_radio.grid(row=2, column=1, sticky="w", padx=10, pady=10)
tailscale_mode_radio = tk.Radiobutton(root, text="Tailscale Mode (Tailscale IP)", variable=mode_var, value="tailscale")
tailscale_mode_radio.grid(row=3, column=1, sticky="w", padx=10, pady=10)

run_button = tk.Button(root, text="Run AssetAtlas", command=lambda: run_docker_thread(mode_var.get()))
run_button.grid(row=5, column=0, padx=10)

progressbar = ttk.Progressbar(length=250)
progressbar.grid(row=5, column=1, padx=10)

shutdown_button = tk.Button(root, text="Shut Down AssetAtlas", command=shutdown_docker_thread)
shutdown_button.grid(row=6, columnspan=2, padx=10, pady=10)

label_status = tk.Label(root, text="")
label_status.grid(row=7, columnspan=2, padx=10, pady=20)

#ensure the .env file exists
if not os.path.exists(ENV_PATH):
    with open(ENV_PATH, "w") as f:
        f.write("IP=localhost:3000\n")
        f.write("TS_AUTH_KEY=\n")

root.mainloop()
