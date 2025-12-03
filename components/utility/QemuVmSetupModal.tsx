
import React from 'react';
import { CloseIcon, ComputerDesktopIcon, ServerIcon } from '../core/Icons';
import { CodeBlock } from '../core/CodeBlock';

interface QemuVmSetupModalProps {
  onClose: () => void;
}

const CUSTOM_ISO_SCRIPT_RAW = `#!/bin/bash
set -e

echo "--- Kael's Sovereign ISO & VM Forge ---"
echo "Phase 1: Building a custom Arch Linux ISO with baked-in installation rituals."
echo "Phase 2: Configuring a QEMU Sanctuary to host it."
echo ""

# --- CONFIGURATION ---
USER_HOME=\$(getent passwd "\\\${SUDO_USER:-\$USER}" | cut -d: -f6)
FORGE_BASE="\$USER_HOME/forge"
ISO_WORK_DIR="\$FORGE_BASE/iso_work"
VM_DIR="\$FORGE_BASE/vm"
ISO_OUTPUT_DIR="\$FORGE_BASE/iso_out"

# --- [1/6] Dependencies ---
echo "--> [1/6] Installing Familiars (archiso, qemu)..."
sudo pacman -S --needed --noconfirm archiso qemu-desktop virt-manager virt-viewer dnsmasq vde2 bridge-utils openbsd-netcat libguestfs
echo "✅ Dependencies ready."
echo ""

# --- [2/6] Prepare ISO Profile ---
echo "--> [2/6] Preparing ISO Blueprint..."
# Cleanup previous attempts
if [ -d "\$ISO_WORK_DIR" ]; then
    echo "    -> Cleaning old build files..."
    sudo rm -rf "\$ISO_WORK_DIR"
fi
mkdir -p "\$ISO_WORK_DIR"
mkdir -p "\$ISO_OUTPUT_DIR"

# Copy standard profile
cp -r /usr/share/archiso/configs/releng/* "\$ISO_WORK_DIR/"

# --- [3/6] Inject Scripts (The Soul of the ISO) ---
echo "--> [3/6] Injecting 'kael-install' ritual into the ISO..."

# We inject the script into /usr/local/bin so it is in the PATH
AI_ROOT="\$ISO_WORK_DIR/airootfs"
mkdir -p "\$AI_ROOT/usr/local/bin" # Ensure directory exists
SCRIPT_DEST="\$AI_ROOT/usr/local/bin/kael-install"

cat > "\$SCRIPT_DEST" <<'EOF'
#!/bin/bash
set -e
echo "--- Kael OS Sovereign Installer ---"

# --- Disk Detection ---
TARGET_DISK=""
if [ -b "/dev/vda" ]; then
    TARGET_DISK="/dev/vda"
elif [ -b "/dev/sda" ]; then
    TARGET_DISK="/dev/sda"
else
    echo "❌ CRITICAL ERROR: No suitable disk found (/dev/vda or /dev/sda)."
    exit 1
fi
echo "--> Detected Target Disk: $TARGET_DISK"

# 1. Partitioning (BIOS/MBR for QEMU simplicity)
echo "--> Partitioning $TARGET_DISK..."
wipefs -a "$TARGET_DISK"
sfdisk "$TARGET_DISK" <<SFDISK
label: dos
,4G,S
,,L,*
SFDISK

# 2. Formatting
echo "--> Formatting..."
# Assuming partitions are 1 and 2. NVMe might be p1/p2 but vda/sda are usually 1/2
PART1="\\\${TARGET_DISK}1"
PART2="\\\${TARGET_DISK}2"

mkswap "$PART1"
swapon "$PART1"
mkfs.btrfs -f "$PART2"

# 3. Mounting
echo "--> Mounting..."
mount "$PART2" /mnt

# 4. Pacstrap
# Added openssh for remote access
echo "--> Installing Core Artifacts..."
pacstrap /mnt base linux linux-firmware grub networkmanager sudo git vim spice-vdagent openssh

# 5. Configuration
echo "--> Configuring The Realm..."
genfstab -U /mnt >> /mnt/etc/fstab

arch-chroot /mnt /bin/bash <<CHROOT
ln -sf /usr/share/zoneinfo/UTC /etc/localtime
hwclock --systohc
echo "en_US.UTF-8 UTF-8" > /etc/locale.gen
locale-gen
echo "LANG=en_US.UTF-8" > /etc/locale.conf
echo "kael-vm" > /etc/hostname

# Users
echo "root:kael" | chpasswd
useradd -m -G wheel -s /bin/bash architect
echo "architect:kael" | chpasswd
echo "%wheel ALL=(ALL:ALL) ALL" > /etc/sudoers.d/architect

# Enable Multilib for gaming support
echo "--> Enabling the Multiverse (multilib)..."
sed -i "/^\\[multilib\\]/,/Include/"'s/^#//' /etc/pacman.conf

# Bootloader (GRUB BIOS)
grub-install --target=i386-pc "$TARGET_DISK"
grub-mkconfig -o /boot/grub/grub.cfg

# Services
systemctl enable NetworkManager
systemctl enable sshd

# Autologin for architect on tty1
mkdir -p /etc/systemd/system/getty@tty1.service.d
echo -e "[Service]\\nExecStart=\\nExecStart=-/sbin/agetty -o '-p -- \\\\\\\\u' --noclear --autologin architect %I \\$TERM" > /etc/systemd/system/getty@tty1.service.d/autologin.conf

# Setup Mount Points for Shares
mkdir -p /home/architect/host_forge
mkdir -p /home/architect/host_webdisk
chown -R architect:architect /home/architect/host_forge
chown -R architect:architect /home/architect/host_webdisk

# Add Automounts to fstab
echo "" >> /etc/fstab
echo "# Kael OS Shared Folders" >> /etc/fstab
echo "host_forge /home/architect/host_forge 9p trans=virtio,version=9p2000.L,rw,_netdev 0 0" >> /etc/fstab
echo "host_webdisk /home/architect/host_webdisk 9p trans=virtio,version=9p2000.L,rw,_netdev 0 0" >> /etc/fstab

CHROOT

echo ""
echo "✅ Installation Complete!"
echo "--> Type 'reboot' to enter your new OS."
EOF

# Enforce executable permissions (755)
chmod 755 "\$SCRIPT_DEST"

# CRITICAL FIX: Append permission rule to profiledef.sh
# This guarantees mkarchiso preserves the executable bit in the final image.
echo 'file_permissions["/usr/local/bin/kael-install"]="0:0:755"' >> "\$ISO_WORK_DIR/profiledef.sh"

echo "✅ Ritual injected and permissions sealed."
echo ""

# --- [4/6] Build the ISO ---
echo "--> [4/6] Forging the ISO (This may take several minutes)..."
# Run mkarchiso
sudo mkarchiso -v -w "\$FORGE_BASE/iso_tmp_work" -o "\$ISO_OUTPUT_DIR" "\$ISO_WORK_DIR"

# Find the generated ISO name
ISO_NAME=\$(ls "\$ISO_OUTPUT_DIR" | grep ".iso" | head -n 1)
ISO_FULL_PATH="\$ISO_OUTPUT_DIR/\$ISO_NAME"

echo "✅ ISO Forged: \$ISO_FULL_PATH"
echo ""

# --- [5/6] Configure QEMU Sanctuary ---
echo "--> [5/6] Preparing QEMU Sanctuary at \$VM_DIR..."
mkdir -p "\$VM_DIR"
DISK_IMG="\$VM_DIR/kael-arch.qcow2"

if [ ! -f "\$DISK_IMG" ]; then
    echo "    -> Creating 500GB storage vessel..."
    qemu-img create -f qcow2 "\$DISK_IMG" 500G
fi

# --- [6/6] Scribe Launchers ---
echo "--> [6/6] Scribing Summoning Scrolls..."

INSTALL_SCRIPT="\$VM_DIR/install_vm.sh"
RUN_SCRIPT="\$VM_DIR/run_vm.sh"

# Flags explanation:
# -drive ...,if=virtio: Fast disk I/O
# -netdev user: Easy internet + Port Forwarding (Host 2222 -> Guest 22)
# -virtfs: Shared folders
# SPICE: Clipboard sharing (FIXED: name=vdagent for chardev, name=com.redhat.spice.0 for port)
COMMON_ARGS="-enable-kvm -m 4G -smp 4 -cpu host \\
-drive file=\\"\$DISK_IMG\\",format=qcow2,if=virtio \\
-vga virtio -display default,show-cursor=on -usb -device usb-tablet \\
-device virtio-serial-pci \\
-chardev spicevmc,id=vdagent,name=vdagent \\
-device virtserialport,chardev=vdagent,name=com.redhat.spice.0 \\
-netdev user,id=net0,hostfwd=tcp::2222-:22 -device virtio-net-pci,netdev=net0 \\
-virtfs local,path=\\"\$FORGE_BASE\\",mount_tag=host_forge,security_model=none,id=host_forge \\
-virtfs local,path=\\"\$USER_HOME/WebDisk\\",mount_tag=host_webdisk,security_model=none,id=host_webdisk"

# Installer boots the custom ISO
cat > "\$INSTALL_SCRIPT" <<EOF
#!/bin/bash
echo "--- Booting Kael Custom ISO ---"
if [ ! -f "\$ISO_FULL_PATH" ]; then
    echo "❌ ERROR: ISO file not found at '\$ISO_FULL_PATH'. Did the build fail?" >&2
    exit 1
fi
if [ -r /dev/kvm ]; then
    qemu-system-x86_64 \$COMMON_ARGS -cdrom "\$ISO_FULL_PATH" -boot d
else
    echo "⚠️  /dev/kvm not accessible. Falling back to software emulation (slow)."
    # Remove -enable-kvm from args for software mode
    NO_KVM_ARGS="\\\${COMMON_ARGS/-enable-kvm/}"
    qemu-system-x86_64 \\\$NO_KVM_ARGS -cdrom "\$ISO_FULL_PATH" -boot d
fi
EOF
chmod +x "\$INSTALL_SCRIPT"

# Runner boots the HDD
cat > "\$RUN_SCRIPT" <<EOF
#!/bin/bash
echo "--- Booting Kael VM ---"
if [ -r /dev/kvm ]; then
    qemu-system-x86_64 \$COMMON_ARGS -boot c
else
    echo "⚠️  /dev/kvm not accessible. Falling back to software emulation (slow)."
    NO_KVM_ARGS="\\\${COMMON_ARGS/-enable-kvm/}"
    qemu-system-x86_64 \\\$NO_KVM_ARGS -boot c
fi
EOF
chmod +x "\$RUN_SCRIPT"

# Desktop Entry
DESKTOP_FILE="\$HOME/.local/share/applications/kael-vm.desktop"
mkdir -p "\$(dirname "\$DESKTOP_FILE")"
cat > "\$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=Kael Arch VM
Comment=Run the Kael OS QEMU Virtual Machine
Exec=\$RUN_SCRIPT
Icon=computer
Terminal=true
Type=Application
Categories=System;Emulator;
EOF
update-desktop-database "\$HOME/.local/share/applications" &>/dev/null || true

echo ""
echo "✨ Grand Ritual Complete!"
echo "---------------------------------------------------"
echo "1. Run '\$INSTALL_SCRIPT' to boot the installer."
echo "2. Inside the VM, type: kael-install"
echo "   (If that fails, try: bash /usr/local/bin/kael-install)"
echo "3. When complete, type 'reboot' or close the window."
echo "4. Run '\$RUN_SCRIPT' (or use the Desktop Menu) to boot your new OS."
echo "---------------------------------------------------"
`;

export const QemuVmSetupModal: React.FC<QemuVmSetupModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center animate-fade-in-fast" onClick={onClose}>
            <div className="bg-forge-panel border-2 border-forge-border rounded-lg shadow-2xl w-full max-w-3xl p-6 m-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                     <h2 className="text-xl font-bold text-forge-text-primary flex items-center gap-2 font-display tracking-wider">
                        <ComputerDesktopIcon className="w-5 h-5 text-dragon-fire" />
                        <span>Forge Custom ISO & VM</span>
                    </h2>
                    <button onClick={onClose} className="text-forge-text-secondary hover:text-forge-text-primary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto pr-2 text-forge-text-secondary leading-relaxed space-y-4">
                    <p>
                        Architect, I have enhanced the ritual with the <strong className="text-dragon-fire">Golden Bridge</strong> and <strong className="text-orc-steel">Profile Pact</strong> protocols.
                    </p>
                    <p className="text-sm p-3 bg-orc-steel/10 border-l-4 border-orc-steel rounded">
                        This updated incantation strictly enforces executable permissions in the ISO profile to ensure <code>kael-install</code> runs. It also includes a smart disk detector to handle different QEMU storage configurations (vda/sda) automatically.
                    </p>

                    <h3 className="font-semibold text-lg text-orc-steel mt-4 mb-2">The Grand Forge Incantation</h3>
                    <p>
                        Run this script on your host. It will install `archiso`, build the custom ISO, create the QEMU disk, and setup the launch scripts.
                    </p>
                    <div className="p-2 bg-dragon-fire/10 border border-dragon-fire/30 rounded text-xs text-dragon-fire mb-2">
                        <strong>Note:</strong> Building an ISO takes time (5-10 minutes) and requires root privileges.
                    </div>
                    <CodeBlock lang="bash">{CUSTOM_ISO_SCRIPT_RAW}</CodeBlock>

                    <div className="border-t border-forge-border pt-4 mt-4">
                        <h3 className="font-bold text-dragon-fire flex items-center gap-2">
                            <ServerIcon className="w-4 h-4" />
                            <span>How to Proceed</span>
                        </h3>
                        <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
                            <li>Run the script above to completion.</li>
                            <li>Run <code className="font-mono text-xs">~/forge/vm/install_vm.sh</code> to boot the new ISO.</li>
                            <li>Inside the VM, simply type <code className="font-mono text-xs text-orc-steel">kael-install</code> and hit Enter.</li>
                            <li>If "Permission Denied" persists, force it with: <code className="font-mono text-xs">bash /usr/local/bin/kael-install</code></li>
                            <li>After reboot, connect via SSH from your host:</li>
                            <li className="font-mono text-xs bg-black/30 p-1 rounded mt-1">ssh -p 2222 architect@localhost</li>
                            <li className="text-xs text-forge-text-secondary mb-2">(Password: kael)</li>
                            
                            <li className="mt-2 pt-2 border-t border-forge-border/30">
                                <span className="text-dragon-fire font-semibold text-xs">Remmina / GUI Config:</span>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-1 text-forge-text-secondary bg-black/20 p-2 rounded">
                                    <span>Protocol:</span> <span className="text-forge-text-primary">SSH</span>
                                    <span>Server:</span> <span className="text-forge-text-primary">127.0.0.1</span>
                                    <span>Port:</span> <span className="text-forge-text-primary">2222</span>
                                    <span>User:</span> <span className="text-forge-text-primary">architect</span>
                                    <span>Pass:</span> <span className="text-forge-text-primary">kael</span>
                                </div>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};
