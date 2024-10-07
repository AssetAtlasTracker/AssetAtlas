import os
import subprocess
import tkinter as tk
from tkinter import messagebox
import threading
import time
from envWriter import set_env_variable

# Function to write Tailscale auth key to .env file inside the docker folder
def save_auth_key():
    auth_key = auth_key_entry.get()
    if not auth_key:
        messagebox.showwarning("Input Error", "Please type something")
        return

    try:
        set_env_variable("TS_AUTH_KEY", auth_key)

        messagebox.showinfo("Success", "Tailscale Auth Key saved to docker/.env")
    except Exception as e:
        messagebox.showerror("Error", f"Failed to save Tailscale Auth Key: {e}")

def show_url_popup(url): #this is all so our popup has copy paste, basically ignore all
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
        #messagebox.showinfo("Copied", "URL copied to clipboard!")
    copy_button = tk.Button(popup, text="Copy URL", command=copy_to_clipboard)
    copy_button.pack(pady=5)
    ok_button = tk.Button(popup, text="OK", command=popup.destroy)
    ok_button.pack(pady=5)
    popup.grab_set()
    popup.focus_set()
    popup.transient(root)

def shutdown_docker_thread():#Why do we do this stuff in threads? docker takes a while, we want the application to still do stuff while waiting
    shutdown_button.config(state=tk.DISABLED)
    thread = threading.Thread(target=shutdown_docker)
    thread.start()

def shutdown_docker():
    try:
        compose_file = os.path.join("docker", "docker-compose-tailscale.yml")
        command = ["docker-compose", "-f", compose_file, "stop"]

        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, err = process.communicate()

        if process.returncode != 0:
            shutdown_button.config(state=tk.NORMAL)
            messagebox.showerror("Error", f"Failed to stop Docker Containers:\n{err.decode()}")
            return

        shutdown_button.config(state=tk.NORMAL)
        label_status.config(text="Docker containers stopped")

    except Exception as e:
        shutdown_button.config(state=tk.NORMAL)
        messagebox.showerror("Error", f"Unexpected error: {e}")
    


def run_docker_compose_thread(mode):
    run_button.config(state=tk.DISABLED)
    thread = threading.Thread(target=run_docker_compose, args=(mode,))
    thread.start()

# Function to run the appropriate docker-compose command based on mode
def run_docker_compose(mode):
    try:
        if mode == "local":
            compose_file = os.path.join("docker", "docker-compose.yml")
            command = ["docker-compose", "-f", compose_file, "up", "--build", "-d"]
            url = "http://localhost:3000"
            set_env_variable("IP", "localhost:3000")
        elif mode == "tailscale":
            compose_file = os.path.join("docker", "docker-compose-tailscale.yml")
            command = ["docker-compose", "-f", compose_file, "up", "--build", "-d"]

        # Run the docker-compose command
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        out, err = process.communicate()

        # Check for errors
        if process.returncode != 0:
            run_button.config(state=tk.NORMAL)
            messagebox.showerror("Error", f"Failed to run Docker Compose:\n{err.decode()}")
            return

        if mode == "tailscale":
            max_attempts = 20
            tailscale_ip = None
            for attempt in range(max_attempts):
                try:
                    print(f"Attempt {attempt + 1} to get Tailscale IP...")
                    tailscale_ip = subprocess.check_output(
                        ["docker", "exec", "tailscale", "tailscale", "ip", "-4"]
                    ).decode().strip()
                    if tailscale_ip:
                        print(f"Found Tailscale IP: {tailscale_ip}")
                        set_env_variable("IP", tailscale_ip + ":3000")
                        break
                except subprocess.CalledProcessError as e:
                    print(f"Attempt {attempt + 1} failed: {e}")
                time.sleep(3)  # Wait for 3 seconds before retrying
            else:
                run_button.config(state=tk.NORMAL)
                messagebox.showerror("Error", "Failed to get Tailscale IP after multiple attempts.")
                return

            url = f"http://{tailscale_ip}:3000"
            

        show_url_popup(url)
        print(f"Service is running at {url}")
        label_status.config(text="Docker containers started (" + url + ")")
        run_button.config(state=tk.NORMAL)

    except Exception as e:
        run_button.config(state=tk.NORMAL)
        messagebox.showerror("Error", f"Unexpected error: {e}")

root = tk.Tk()
root.title("Docker Compose Launcher")

# GUI for Tailscale Auth Key input
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

# Button to run Docker Compose
run_button = tk.Button(root, text="Run Docker Compose", command=lambda: run_docker_compose_thread(mode_var.get()))
run_button.grid(row=4, columnspan=2, padx=10, pady=20)

shutdown_button = tk.Button(root, text="Shut Down Docker Containers", command=lambda: shutdown_docker_thread())
shutdown_button.grid(row=5, columnspan=2, padx=10, pady=10)

label_status = tk.Label(root, text="")
label_status.grid(row=6, columnspan=2, padx=10, pady=20)

root.mainloop()