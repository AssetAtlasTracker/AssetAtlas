# pylint: disable=missing-module-docstring, missing-function-docstring, line-too-long, broad-exception-caught global-statement
import os
import subprocess
import tkinter as tk
from tkinter import messagebox
from tkinter import ttk
import threading
import time
from typing import List
from env_writer import set_env_variable

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# pylint: disable-next=invalid-name
containers_probably_running = False
processes: List[subprocess.Popen[bytes]] = []


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
    run_button.config(state=tk.DISABLED)
    progressbar.config(mode="indeterminate", length=250)
    progressbar.start()
    thread = threading.Thread(target=shutdown_docker)
    thread.start()


def shutdown_docker():
    global containers_probably_running
    try:
        label_status.config(text="Stopping docker containers...")

        # only target AssetAtlas containers
        command = ["docker", "compose", "ls", "--filter", "name=assetatlas", "-q"]
        update_command_display(command)
        running = subprocess.check_output(command).decode().strip()

        if running:
            compose_file = os.path.join(SCRIPT_DIR, "docker", "docker-compose.yml")
            command = ["docker-compose", "-f", compose_file, "stop"]
            update_command_display(command)

            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            processes.append(process)
            _, err = process.communicate()

            if process.returncode != 0:
                shutdown_button.config(state=tk.NORMAL)
                messagebox.showerror("Error", f"Failed to stop Docker Containers:\n{err.decode()}")
                return

        label_status.config(text="Docker containers stopped")
        containers_probably_running = False

    except Exception as e:
        messagebox.showerror("Error", f"Unexpected error: {e}")
    finally:
        shutdown_button.config(state=tk.NORMAL)
        run_button.config(state=tk.NORMAL)
        progressbar.stop()


def on_closing():
    if containers_probably_running:
        if messagebox.askyesno(
            "Quit",
            "Do you want to shut down the Docker containers before exiting? (If you dont, you will need to shut the program down in docker desktop)",
        ):
            shutdown_docker()
    # TODO how to actually kill these? tried a lot of things with no luck
    for process in processes:
        if process.poll() is None:
            print("Process is still running: ", process.args)
    root.destroy()


def run_docker_compose_thread(mode: str):
    run_button.config(state=tk.DISABLED)
    shutdown_button.config(state=tk.DISABLED)
    thread = threading.Thread(target=run_docker_compose, args=(mode,))
    thread.start()


# Function to run the appropriate docker-compose command based on mode
def run_docker_compose(mode: str):
    global containers_probably_running
    label_status.config(text="Starting docker containers...")
    progressbar.config(mode="indeterminate", length=250)
    progressbar.start()
    try:
        url = ""
        base_compose_file = os.path.join(SCRIPT_DIR, "docker", "docker-compose.yml")
        tailscalecompose__file = os.path.join(SCRIPT_DIR, "docker", "docker-compose-tailscale.yml")

        if mode == "local":
            url = "http://localhost:3000"
            set_env_variable("IP", "localhost:3000", os.path.join(SCRIPT_DIR, "docker", ".env"))
            command = ["docker-compose", "-f", base_compose_file, "up", "-d"] + (
                ["--build"] if build_var.get() else []
            )
        elif mode == "tailscale":
            command = [
                "docker-compose",
                "-f",
                base_compose_file,
                "-f",
                tailscalecompose__file,
                "up",
                "-d",
            ] + (["--build"] if build_var.get() else [])
        else:
            raise ValueError("Invalid mode selected: " + mode)

        update_command_display(command)

        # working directory to where docker-compose files are located
        os.chdir(os.path.join(SCRIPT_DIR, "docker"))

        # Run the docker-compose command
        containers_probably_running = True
        run_button.config(state=tk.DISABLED)
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        processes.append(process)
        _, err = process.communicate()

        # Check for errors
        if process.returncode != 0:
            run_button.config(state=tk.NORMAL)
            shutdown_button.config(state=tk.NORMAL)
            messagebox.showerror("Error", f"Failed to run Docker Compose:\n{err.decode()}")
            progressbar.stop()
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
                        subprocess.check_output(["docker", "exec", "tailscale", "tailscale", "ip", "-4"])
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
                shutdown_button.config(state=tk.NORMAL)
                progressbar.stop()
                messagebox.showerror("Error", "Failed to get Tailscale IP after multiple attempts.")
                return

            url = f"http://{tailscale_ip}:3000"
        else:
            raise ValueError("Invalid mode selected: " + mode)

        show_url_popup(url)
        print(f"Service is running at {url}")
        label_status.config(text="Docker containers started (" + url + ")")
    except Exception as e:
        messagebox.showerror("Error", f"Unexpected error: {e}")
    finally:
        run_button.config(state=tk.NORMAL)
        shutdown_button.config(state=tk.NORMAL)
        progressbar.stop()


root = tk.Tk()
root.title("Docker Compose Launcher")
root.protocol("WM_DELETE_WINDOW", on_closing)

mode_var = tk.StringVar(value="local")

## Begin frame
mode_frame = tk.LabelFrame(root, text="Select Mode", bd=2, relief="groove", padx=12, pady=8, width=560)
mode_frame.grid(row=2, column=0, columnspan=2, padx=10, pady=10, sticky="w")

# Local mode on its own row
local_mode_radio = tk.Radiobutton(mode_frame, text="Local Mode (localhost)", variable=mode_var, value="local")
local_mode_radio.grid(row=0, column=0, sticky="w", padx=10, pady=4)

# Tailscale mode + Auth key entry and save button
tailscale_mode_radio = tk.Radiobutton(
    mode_frame,
    text="Tailscale Mode (Tailscale IP)",
    variable=mode_var,
    value="tailscale",
)
tailscale_mode_radio.grid(row=1, column=0, sticky="w", padx=10, pady=4)

tk.Label(mode_frame, text="Tailscale Auth Key:").grid(row=1, column=1, sticky="w", padx=(12, 4))
auth_key_entry = tk.Entry(mode_frame, width=36)
auth_key_entry.grid(row=1, column=2, sticky="w", padx=(0, 8))
save_key_button = tk.Button(mode_frame, text="Save Auth Key", command=save_auth_key)
save_key_button.grid(row=1, column=3, sticky="w", padx=4)
## End frame

# 'Rebuild' checkbox on its own row
build_var = tk.BooleanVar(value=True)
build_checkbox = tk.Checkbutton(
    root, text="Rebuild containers? (use if code has changed)", variable=build_var
)
build_checkbox.grid(row=4, columnspan=2, sticky="w", padx=10, pady=5)

# Button to run Docker Compose, left
run_button = tk.Button(
    root,
    text="Run Docker Compose",
    command=lambda: run_docker_compose_thread(mode_var.get()),
)
run_button.grid(row=5, column=0, padx=10)
run_button.config(state=tk.NORMAL if not containers_probably_running else tk.DISABLED)  # initial state

# Progressbar to communicate when application is busy
progressbar = ttk.Progressbar(length=250)
progressbar.grid(row=5, column=1, padx=10)

# Shut down button on its own row
shutdown_button = tk.Button(root, text="Shut Down Docker Containers", command=shutdown_docker_thread)
shutdown_button.grid(row=6, columnspan=2, padx=10, pady=10)

# Read-only selectable text box to display executed docker commands, on its own row
command_text = tk.Text(root, height=2, width=72, wrap="none")
command_text.grid(row=7, column=0, columnspan=2, padx=10, pady=5, sticky="we")
command_text.config(state="disabled")


def update_command_display(cmd: list[str]):
    text = " ".join(cmd)
    print(text)
    try:
        command_text.config(state="normal")
        command_text.delete("1.0", tk.END)
        command_text.insert("1.0", text)
        command_text.config(state="disabled")
    except NameError:
        # widget not yet created
        pass


label_status = tk.Label(root, text="(Press a button above to take an action)")
label_status.grid(row=8, columnspan=2, padx=10, pady=10)

root.mainloop()
