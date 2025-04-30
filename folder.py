import os

def print_directory_tree(root_dir, indent=""):
    for item in os.listdir(root_dir):
        path = os.path.join(root_dir, item)
        if os.path.isdir(path):
            print(indent + f"📁 {item}/")
            print_directory_tree(path, indent + "    ")
        else:
            print(indent + f"📄 {item}")

# Change 'your_project_root_folder' to your project's folder path
print_directory_tree("C:\\Users\\kazin\\Desktop\\IDP II Project\\shaol_sphere")
