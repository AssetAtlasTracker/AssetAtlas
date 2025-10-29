# pylint: disable=missing-module-docstring, missing-function-docstring, line-too-long, broad-exception-caught
import os
import subprocess
import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import threading
import time
from env_writer import set_env_variable

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


# Function to write Tailscale auth key to .env file inside the docker folder
def save_auth_key():
    auth_key = auth_key_entry.get()
    if not auth_key:
        messagebox.showwarning("Input Error", "Please type something")
        return

    try:
        docker_env_path = os.path.join(SCRIPT_DIR, "docker", ".env")
        set_env_variable("TS_AUTH_KEY", auth_key, docker_env_path)

        messagebox.showinfo("Success", "Tailscale Auth Key saved to docker/.env")
    except Exception as e:
        messagebox.showerror("Error", f"Failed to save Tailscale Auth Key: {e}")


# this is all so our popup has copy paste, basically ignore all
def show_url_popup(url: str):
    popup = tk.Toplevel()
    popup.title("Service Running")
    tk.Label(popup, text="Service is running at:").pack(pady=5)
    url_entry = tk.Entry(popup, width=50)
    url_entry.pack(pady=5, padx=10)
    url_entry.insert(0, url)
    url_entry.config(state="readonly")
    url_entry.configure(state="normal")
    url_entry.select_range(0, "end")
    url_entry.focus()
    url_entry.configure(state="readonly")

    def copy_to_clipboard():
        popup.clipboard_clear()
        popup.clipboard_append(url)
        copy_button.config(text="copied!")

    copy_button = tk.Button(popup, text="Copy URL", command=copy_to_clipboard)
    copy_button.pack(pady=5)
    ok_button = tk.Button(popup, text="OK", command=popup.destroy)
    ok_button.pack(pady=5)
    popup.grab_set()
    popup.focus_set()
    popup.transient(root)


# This is done in threads since docker takes a while, and we want the application to still do stuff while waiting
def shutdown_docker_thread():
    shutdown_button.config(state=tk.DISABLED)
    thread = threading.Thread(target=shutdown_docker)
    thread.start()


def shutdown_containers_from_compose_file(compose_file: str):
    compose_file = os.path.join(SCRIPT_DIR, "docker", compose_file)

    command = ["docker-compose", "-f", compose_file, "stop"]

    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    _, err = process.communicate()

    if process.returncode != 0:
        shutdown_button.config(state=tk.NORMAL)
        messagebox.showerror(
            "Error", f"Failed to stop Docker Containers:\n{err.decode()}"
        )
        return


def shutdown_docker():
    try:
        # only target AssetAtlas containers
        command = ["docker", "compose", "ls", "--filter", "name=assetatlas", "-q"]
        running = subprocess.check_output(command).decode().strip()

        if running:
            compose_filenames = ["docker-compose.yml", "docker-compose-tailscale.yml"]

            for filename in compose_filenames:
                shutdown_containers_from_compose_file(filename)

        shutdown_button.config(state=tk.NORMAL)
        label_status.config(text="Docker containers stopped")

    except Exception as e:
        shutdown_button.config(state=tk.NORMAL)
        messagebox.showerror("Error", f"Unexpected error: {e}")


def on_closing():
    if messagebox.askyesno(
        "Quit",
        "Do you want to shut down the Docker containers before exiting? (If you dont, you will need to shut the program down in docker desktop)",
    ):
        shutdown_docker()
    root.destroy()


def run_docker_compose_thread(mode: str):
    run_button.config(state=tk.DISABLED)
    thread = threading.Thread(target=run_docker_compose, args=(mode,))
    thread.start()


# Function to run the appropriate docker-compose command based on mode
def run_docker_compose(mode: str):
    compose_progressbar = ttk.Progressbar(mode="indeterminate", length=250)
    compose_progressbar.grid(row=5, column=1, padx=10)
    compose_progressbar.start()
    try:
        url = ""
        if mode == "local":
            compose_file = os.path.join(SCRIPT_DIR, "docker", "docker-compose.yml")
            command = ["docker-compose", "-f", compose_file, "up", "--build", "-d"]
            url = "http://localhost:3000"
            set_env_variable(
                "IP", "localhost:3000", os.path.join(SCRIPT_DIR, "docker", ".env")
            )
        elif mode == "tailscale":
            compose_file = os.path.join(
                SCRIPT_DIR, "docker", "docker-compose-tailscale.yml"
            )
            command = ["docker-compose", "-f", compose_file, "up", "--build", "-d"]
        else:
            raise ValueError("Invalid mode selected: " + mode)

        # working directory to where docker-compose files are located
        os.chdir(os.path.join(SCRIPT_DIR, "docker"))

        # Run the docker-compose command
        process = subprocess.Popen(
            command, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        _, err = process.communicate()

        # Check for errors
        if process.returncode != 0:
            run_button.config(state=tk.NORMAL)
            messagebox.showerror(
                "Error", f"Failed to run Docker Compose:\n{err.decode()}"
            )
            return

        if mode == "local":
            pass
        elif mode == "tailscale":
            max_attempts = 20
            tailscale_ip = None
            for attempt in range(max_attempts):
                try:
                    print(f"Attempt {attempt + 1} to get Tailscale IP...")
                    tailscale_ip = (
                        subprocess.check_output(
                            ["docker", "exec", "tailscale", "tailscale", "ip", "-4"]
                        )
                        .decode()
                        .strip()
                    )
                    if tailscale_ip:
                        print(f"Found Tailscale IP: {tailscale_ip}")
                        set_env_variable(
                            "IP",
                            tailscale_ip + ":3000",
                            os.path.join(SCRIPT_DIR, "docker", ".env"),
                        )
                        break
                except subprocess.CalledProcessError as e:
                    print(f"Attempt {attempt + 1} failed: {e}")
                time.sleep(3)  # Wait for 3 seconds before retrying
            else:
                run_button.config(state=tk.NORMAL)
                messagebox.showerror(
                    "Error", "Failed to get Tailscale IP after multiple attempts."
                )
                return

            url = f"http://{tailscale_ip}:3000"
        else:
            raise ValueError("Invalid mode selected: " + mode)

        show_url_popup(url)
        print(f"Service is running at {url}")
        label_status.config(text="Docker containers started (" + url + ")")
        run_button.config(state=tk.NORMAL)

    except Exception as e:
        run_button.config(state=tk.NORMAL)
        messagebox.showerror("Error", f"Unexpected error: {e}")
    finally:
        compose_progressbar.stop()


root = tk.Tk()
root.title("Docker Compose Launcher")
root.protocol("WM_DELETE_WINDOW", on_closing)

# GUI for Tailscale Auth Key input
tk.Label(root, text="Tailscale Auth Key:").grid(row=0, column=0, padx=10, pady=10)
auth_key_entry = tk.Entry(root, width=40)
auth_key_entry.grid(row=0, column=1, padx=10, pady=10)

save_key_button = tk.Button(root, text="Save Auth Key", command=save_auth_key)
save_key_button.grid(row=1, columnspan=2, padx=10, pady=10)

mode_var = tk.StringVar(value="local")

tk.Label(root, text="Select Mode:").grid(row=2, column=0, padx=10, pady=10)
local_mode_radio = tk.Radiobutton(
    root, text="Local Mode (localhost)", variable=mode_var, value="local"
)
local_mode_radio.grid(row=2, column=1, sticky="w", padx=10, pady=10)
tailscale_mode_radio = tk.Radiobutton(
    root, text="Tailscale Mode (Tailscale IP)", variable=mode_var, value="tailscale"
)
tailscale_mode_radio.grid(row=3, column=1, sticky="w", padx=10, pady=10)

# Button to run Docker Compose
run_button = tk.Button(
    root,
    text="Run Docker Compose",
    command=lambda: run_docker_compose_thread(mode_var.get()),
)
run_button.grid(row=5, column=0, padx=10)

progressbar = ttk.Progressbar(length=250)
progressbar.grid(row=5, column=1, padx=10)

shutdown_button = tk.Button(
    root, text="Shut Down Docker Containers", command=shutdown_docker_thread
)
shutdown_button.grid(row=6, columnspan=2, padx=10, pady=10)

label_status = tk.Label(root, text="")
label_status.grid(row=7, columnspan=2, padx=10, pady=20)

root.mainloop()
