import os

def set_env_variable(key, value, env_file):
    if os.path.exists(env_file):
        with open(env_file, 'r') as file:
            lines = file.readlines()
    else:
        lines = []

    found = False
    for i, line in enumerate(lines):
        if line.startswith(f'{key}='):
            lines[i] = f'{key}={value}\n'
            found = True
            break
    
    #If the key wasn't found, add it to the file
    if not found:
        lines.append(f'{key}={value}\n')

    #Write the updated content back to the .env file
    with open(env_file, 'w') as file:
        file.writelines(lines)