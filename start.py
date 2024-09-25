import os
import subprocess
import tkinter as tk
from tkinter import messagebox
import threading
import time

# Function to write Tailscale auth key to .env file inside the docker folder
def save_auth_key():
    auth_key = auth_key_entry.get()
    if not auth_key:
        messagebox.showwarning("Input Error", "Please type something")
        return

    # Path to the .env file inside the docker folder
    env_file_path = os.path.join("docker", ".env")

    try:
        # Read existing lines if the .env file exists
        if os.path.exists(env_file_path):
            with open(env_file_path, "r") as env_file:
                lines = env_file.readlines()
        else:
            lines = []
        # Update or add the TS_AUTH_KEY line
        with open(env_file_path, "w") as env_file:
            updated = False
            for line in lines:
                if line.startswith("TS_AUTH_KEY="):
                    env_file.write(f"TS_AUTH_KEY={auth_key}\n")
                    updated = True
                else:
                    env_file.write(line)
            if not updated:
                env_file.write(f"TS_AUTH_KEY={auth_key}\n")

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

# Function to run docker-compose in a separate thread
def run_docker_compose_thread(mode):
    # Disable the run button to prevent multiple clicks
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

root.mainloop()