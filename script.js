
"use strict";

// ============================================
// TEAM BLACKLIGHT — LINUX-STYLE SHELL SIMULATOR
// ============================================
// Everything in this section runs against an in-memory virtual filesystem.
// No command is sent to the visitor's actual computer.

const terminalForm = document.getElementById("terminal-form");
const terminalInput = document.getElementById("terminal-input");
const terminalOutput = document.getElementById("terminal-output");

const shellState = {
    user: "guest",
    host: "team-blacklight",
    cwd: "/home/guest",
    history: [],
    historyIndex: 0,
    env: { HOME: "/home/guest", USER: "guest", SHELL: "/bin/bash", TERM: "xterm-256color", LANG: "en_CA.UTF-8", PATH: "/usr/local/bin:/usr/bin:/bin" },
    lastStatus: 0
};

const virtualFS = {
    "/": { type: "dir", mode: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-10-28 18:00" },
    "/bin": { type: "dir", mode: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-10-28 18:00" },
    "/dev": { type: "dir", mode: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-10-28 18:00" },
    "/etc": { type: "dir", mode: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-10-28 18:00" },
    "/home": { type: "dir", mode: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-10-28 18:00" },
    "/home/guest": { type: "dir", mode: "drwxr-x---", owner: "guest", group: "guest", modified: "2026-10-28 18:00" },
    "/home/guest/Desktop": { type: "dir", mode: "drwxr-xr-x", owner: "guest", group: "guest", modified: "2026-10-28 18:00" },
    "/home/guest/Documents": { type: "dir", mode: "drwxr-xr-x", owner: "guest", group: "guest", modified: "2026-10-28 18:00" },
    "/home/guest/Projects": { type: "dir", mode: "drwxr-xr-x", owner: "guest", group: "guest", modified: "2026-10-28 18:00" },
    "/home/guest/Projects/mission-link": { type: "dir", mode: "drwxr-xr-x", owner: "guest", group: "guest", modified: "2026-10-28 18:00" },
    "/home/guest/Projects/mOS": { type: "dir", mode: "drwxr-xr-x", owner: "guest", group: "guest", modified: "2026-10-28 18:00" },
    "/home/guest/team-blacklight": { type: "dir", mode: "drwxr-xr-x", owner: "guest", group: "guest", modified: "2026-10-28 18:00" },
    "/tmp": { type: "dir", mode: "drwxrwxrwt", owner: "root", group: "root", modified: "2026-10-28 18:00" },
    "/usr": { type: "dir", mode: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-10-28 18:00" },
    "/usr/bin": { type: "dir", mode: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-10-28 18:00" },
    "/var": { type: "dir", mode: "drwxr-xr-x", owner: "root", group: "root", modified: "2026-10-28 18:00" },
    "/home/guest/README.txt": { type: "file", mode: "-rw-r--r--", owner: "guest", group: "guest", content: "Welcome to the Team Blacklight shell simulator.\nThis is a virtual Linux-like environment running in your browser.\nTry: ls -la, uname -a, or help.", modified: "2026-10-28 18:00" },
    "/home/guest/Documents/policies-draft.txt": { type: "file", mode: "-rw-r--r--", owner: "guest", group: "guest", content: "Team Blacklight policies are drafts and are not yet formally adopted.\nReview and approve policies before treating them as official.", modified: "2026-10-28 18:00" },
    "/home/guest/Documents/project-notes.txt": { type: "file", mode: "-rw-r--r--", owner: "guest", group: "guest", content: "Projects are developed collaboratively.\nRecord IP ownership and agreements before work begins.", modified: "2026-10-28 18:00" },
    "/home/guest/Desktop/Welcome.txt": { type: "file", mode: "-rw-r--r--", owner: "guest", group: "guest", content: "SYSTEM ONLINE. Creativity has no permissions.\nWelcome to Team Blacklight.", modified: "2026-10-28 18:00" },
    "/home/guest/team-blacklight/README.txt": { type: "file", mode: "-rw-r--r--", owner: "guest", group: "guest", content: "TEAM BLACKLIGHT // PUBLIC TERMINAL\nProjects: Mission Link, mOS, and experimental software.\nStatus: development.", modified: "2026-10-28 18:00" }
};

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function terminalPrint(text, className = "") {
    const p = document.createElement("p");
    if (className) p.className = className;
    p.textContent = String(text);
    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function terminalPre(text, className = "") {
    const pre = document.createElement("pre");
    pre.className = "terminal-pre" + (className ? " " + className : "");
    pre.textContent = String(text);
    terminalOutput.appendChild(pre);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function terminalHTML(html) {
    terminalOutput.insertAdjacentHTML("beforeend", html);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function tokenizeShell(line) {
    const tokens = [];
    let token = "", quote = null, escaped = false, active = false;
    for (const ch of line) {
        if (escaped) { token += ch; escaped = false; active = true; continue; }
        if (ch === "\\" && quote !== "'") { escaped = true; active = true; continue; }
        if ((ch === "'" || ch === '"')) {
            if (!quote) { quote = ch; active = true; continue; }
            if (quote === ch) { quote = null; continue; }
        }
        if (/\s/.test(ch) && !quote) {
            if (active) { tokens.push(token); token = ""; active = false; }
        } else { token += ch; active = true; }
    }
    if (escaped) token += "\\";
    if (active) tokens.push(token);
    return tokens;
}

function normalizePath(path) {
    if (!path || path === "~") return shellState.env.HOME;
    if (path.startsWith("~/")) path = shellState.env.HOME + path.slice(1);
    const joined = path.startsWith("/") ? path : shellState.cwd + "/" + path;
    const stack = [];
    for (const part of joined.split("/")) {
        if (!part || part === ".") continue;
        if (part === "..") stack.pop();
        else stack.push(part);
    }
    return "/" + stack.join("/");
}

function nodeAt(path) { return virtualFS[normalizePath(path)]; }
function parentPath(path) { const p = normalizePath(path); const i = p.lastIndexOf("/"); return i <= 0 ? "/" : p.slice(0, i); }
function baseName(path) { return normalizePath(path).split("/").pop() || "/"; }
function childrenOf(path) {
    const dir = normalizePath(path);
    const prefix = dir === "/" ? "/" : dir + "/";
    return Object.keys(virtualFS).filter(key => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"));
}
function ensureParent(path) {
    const parent = parentPath(path);
    return virtualFS[parent] && virtualFS[parent].type === "dir";
}
function readVirtualFile(path) {
    const key = normalizePath(path), node = virtualFS[key];
    if (!node) throw new Error("No such file or directory");
    if (node.type === "dir") throw new Error("Is a directory");
    return node.content || "";
}
function outputListing(path, args) {
    const long = args.some(a => a === "-l" || a === "-la" || a === "-al" || a === "-lah" || a === "-lh" || a === "--long");
    const all = args.some(a => a.includes("a") && a.startsWith("-")) || args.includes("--all");
    const human = args.some(a => a.includes("h") && a.startsWith("-"));
    const entries = childrenOf(path).map(key => ({ key, node: virtualFS[key], name: baseName(key) }));
    if (all) entries.unshift({ key: normalizePath(path) + "/..", node: virtualFS[parentPath(path)], name: ".." }, { key: normalizePath(path) + "/.", node: virtualFS[normalizePath(path)], name: "." });
    entries.sort((a,b) => a.name.localeCompare(b.name));
    if (!long) return entries.map(e => e.name + (e.node?.type === "dir" ? "/" : "")).join("    ") || "";
    return entries.map(e => {
        const n = e.node || {};
        const size = n.type === "dir" ? (human ? "4.0K" : "4096") : String((n.content || "").length);
        return [n.mode || "?????????", "1", n.owner || "guest", n.group || "guest", size.padStart(5), n.modified || "2026-10-28 18:00", e.name + (n.type === "dir" ? "/" : "")].join("  ");
    }).join("\n");
}

function shellHelp() {
    return [
        "GNU bash-like web simulator — commands operate on a virtual filesystem only.",
        "",
        "FILES:     ls [-lah] [PATH]   cd [DIR]   pwd   tree [PATH]   stat FILE",
        "           cat FILE...        less FILE   head [-n N] FILE   tail [-n N] FILE",
        "           touch FILE...      mkdir [-p] DIR...   cp [-r] SRC DEST",
        "           mv SRC DEST        rm [-r] FILE...     find [PATH] [-name PATTERN]",
        "           file FILE...       grep [-in] PATTERN FILE...   wc [-lwm] FILE...",
        "           chmod MODE FILE    (simulated metadata only)",
        "SYSTEM:    whoami   id   hostname   uname [-a|-r|-s|-m]",
        "           date   uptime   ps [aux]   df [-h]   free [-h]   env",
        "           echo TEXT   printf FORMAT [ARGS...]   history   clear",
        "PACKAGES:  sudo apt update   sudo apt list --installed   sudo apt install PACKAGE",
        "           sudo apt remove PACKAGE   sudo systemctl status SERVICE",
        "TEAM:      projects   about   status   store   contact   account   secret",
        "SHELL:     help [COMMAND]   exit   reset",
        "",
        "FLAGS are supported for common commands. This is a simulation: no real OS access,",
        "network access, package installation, or administrator privileges are available."
    ].join("\n");
}

function runSimulatedSudo(args) {
    if (!args.length) return "usage: sudo COMMAND\nThis is a simulation; no real administrator password is needed or accepted.";
    const command = args[0];
    const rest = args.slice(1);
    if (command === "apt" || command === "apt-get") {
        const sub = rest[0] || "";
        if (sub === "update") return [
            "[sudo] password for guest: (simulated authentication accepted)",
            "Hit:1 https://packages.team-blacklight.invalid stable InRelease",
            "Hit:2 https://archive.ubuntu.invalid noble InRelease",
            "Reading package lists... Done",
            "Building dependency tree... Done",
            "Reading state information... Done",
            "All simulated package indexes are up to date."
        ].join("\n");
        if (sub === "list" && rest.includes("--installed")) return "Listing... Done\nbash-sim-base/stable 1.0 all [installed]\nteam-blacklight-shell/stable 0.4 all [installed]";
        if (sub === "install" || sub === "remove" || sub === "purge") {
            const packages = rest.slice(1).filter(a => !a.startsWith("-"));
            if (!packages.length) return "E: No package specified.";
            return "[sudo] password for guest: (simulated authentication accepted)\n" +
                (sub === "install" ? "The following NEW packages would be installed: " : "The following packages would be removed: ") +
                packages.join(" ") + "\nSimulation only: no packages were changed.";
        }
        return "apt " + rest.join(" ") + "\nTry: sudo apt update | sudo apt list --installed | sudo apt install nano";
    }
    if (command === "systemctl") return rest[0] === "status"
        ? "● " + (rest[1] || "example.service") + " - Simulated service\n   Loaded: loaded (virtual unit; simulated)\n   Active: active (running) since Wed 2026-10-28 18:00:00 PDT\n   Status: no real service was queried."
        : "systemctl: simulated only. Try: sudo systemctl status ssh";
    if (command === "whoami") return "root";
    if (command === "id") return "uid=0(root) gid=0(root) groups=0(root) (simulated)";
    return "sudo: " + command + ": command not available in the simulator\nNo real command was executed and no password was collected.";
}

function runShellCommand(input) {
    const args = tokenizeShell(input);
    if (!args.length) return;
    const command = args.shift();
    const flags = args.filter(a => a.startsWith("-"));
    const operands = args.filter(a => !a.startsWith("-"));
    const fail = message => { shellState.lastStatus = 1; return message; };
    const now = new Date();
    const fileArgs = args.filter(a => !a.startsWith("-") && !/^\d+$/.test(a));

    if (command === "help" || command === "man") {
        if (command === "man" && args[0]) return "Manual page for " + args[0] + " (simulated).\nType help for supported commands and flags.";
        return shellHelp();
    }
    if (command === "clear") { terminalOutput.replaceChildren(); return ""; }
    if (command === "reset") {
        for (const key of Object.keys(virtualFS)) if (!["/", "/bin", "/dev", "/etc", "/home", "/home/guest", "/home/guest/Desktop", "/home/guest/Documents", "/home/guest/Projects", "/home/guest/Projects/mission-link", "/home/guest/Projects/mOS", "/home/guest/team-blacklight", "/tmp", "/usr", "/usr/bin", "/var", "/home/guest/README.txt", "/home/guest/Documents/policies-draft.txt", "/home/guest/Documents/project-notes.txt", "/home/guest/Desktop/Welcome.txt", "/home/guest/team-blacklight/README.txt"].includes(key)) delete virtualFS[key];
        shellState.cwd = shellState.env.HOME; shellState.history = []; shellState.historyIndex = 0; return "Virtual shell reset. Built-in sample files restored.";
    }
    if (command === "exit" || command === "logout") return "logout\nSession ended (simulation). Refresh the page to start a new session.";
    if (command === "sudo") return runSimulatedSudo(args);
    if (command === "pwd") return shellState.cwd;
    if (command === "whoami") return shellState.user;
    if (command === "hostname") return shellState.host;
    if (command === "id") return "uid=1000(guest) gid=1000(guest) groups=1000(guest),27(sudo-sim)";
    if (command === "uname") {
        if (args.includes("-r")) return "6.8.0-tbl-websim";
        if (args.includes("-m")) return "x86_64";
        if (args.includes("-s")) return "Linux";
        return args.includes("-a") ? "Linux team-blacklight 6.8.0-tbl-websim #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux (simulated)" : "Linux";
    }
    if (command === "date") return now.toString();
    if (command === "uptime") return " " + now.toLocaleTimeString() + " up 2 days, 4:12, 1 user, load average: 0.08, 0.12, 0.10 (simulated)";
    if (command === "ps") return args.some(a => a.includes("a")) || args.includes("aux")
        ? "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  18000  8200 ?        Ss   18:00   0:01 /sbin/init (simulated)\nguest      214  0.2  0.4  32000 12000 pts/0    Ss   18:01   0:00 bash\nguest      229  0.0  0.1  12000  3400 pts/0    R+   18:02   0:00 ps aux" : "  PID TTY          TIME CMD\n  214 pts/0    00:00:00 bash\n  229 pts/0    00:00:00 ps";
    if (command === "df") return "Filesystem      " + (args.includes("-h") ? "Size  Used Avail Use% Mounted on\nwebsim-root       8.0G  2.1G  5.9G  27% /\nwebsim-home      20.0G  1.4G 18.6G   7% /home" : "1K-blocks     Used Available Use% Mounted on\n8388608      2202009   6186599  27% /\n20971520     1468006  19503514   7% /home") + "\n(simulated)";
    if (command === "free") return args.includes("-h")
        ? "               total        used        free      shared  buff/cache   available\nMem:           7.7Gi       1.2Gi       4.8Gi        64Mi       1.7Gi       6.1Gi\nSwap:          2.0Gi          0B       2.0Gi\n(simulated)" :
          "              total        used        free      shared  buff/cache   available\nMem:        8074032     1250000     5030000       64000     1794032     6380000\nSwap:       2097148           0     2097148\n(simulated)";
    if (command === "env" || command === "printenv") return Object.entries(shellState.env).map(([k,v]) => k + "=" + v).join("\n");
    if (command === "echo") return args.join(" ");
    if (command === "printf") {
        const fmt = args.shift() || "";
        let i = 0;
        return fmt.replace(/\\n/g, "\n").replace(/%s|%d|%i/g, () => args[i++] ?? "");
    }
    if (command === "history") return shellState.history.map((h,i) => String(i+1).padStart(4) + "  " + h).join("\n") || "history: no commands yet";
    if (command === "cd") {
        const target = args[0] || "~";
        const dest = target === "-" ? shellState.previousCwd || shellState.env.HOME : normalizePath(target);
        if (!virtualFS[dest] || virtualFS[dest].type !== "dir") return fail("bash: cd: " + target + ": No such file or directory");
        shellState.previousCwd = shellState.cwd; shellState.cwd = dest; return "";
    }
    if (command === "ls" || command === "dir" || command === "ll") {
        const pathArg = args.find(a => !a.startsWith("-")) || shellState.cwd;
        const path = normalizePath(pathArg);
        if (!virtualFS[path]) return fail("ls: cannot access '" + pathArg + "': No such file or directory");
        if (virtualFS[path].type !== "dir") return baseName(path);
        return outputListing(path, args);
    }
    if (command === "tree") {
        const root = normalizePath(args.find(a => !a.startsWith("-")) || shellState.cwd);
        if (!virtualFS[root] || virtualFS[root].type !== "dir") return fail("tree: '" + root + "': No such directory");
        const lines = [root === shellState.env.HOME ? "." : root];
        function walk(dir, prefix, depth) {
            if (depth > 4) return;
            const kids = childrenOf(dir).sort();
            kids.forEach((key, i) => {
                const last = i === kids.length - 1, node = virtualFS[key];
                lines.push(prefix + (last ? "└── " : "├── ") + baseName(key) + (node.type === "dir" ? "/" : ""));
                if (node.type === "dir") walk(key, prefix + (last ? "    " : "│   "), depth + 1);
            });
        }
        walk(root, "", 0); return lines.join("\n");
    }
    if (command === "cat" || command === "less" || command === "more") {
        if (!fileArgs.length) return fail(command + ": missing file operand");
        return fileArgs.map(file => {
            try { return (fileArgs.length > 1 ? "==> " + file + " <==\n" : "") + readVirtualFile(file); }
            catch (e) { return command + ": " + file + ": " + e.message; }
        }).join("\n");
    }
    if (command === "touch" || command === "mkdir") {
        if (!operands.length) return fail(command + ": missing file operand");
        for (const operand of operands) {
            const path = normalizePath(operand);
            if (command === "mkdir" && args.includes("-p")) {
                const parts = path.split("/").filter(Boolean); let cur = "";
                for (const part of parts) { cur += "/" + part; if (!virtualFS[cur]) virtualFS[cur] = {type:"dir",mode:"drwxr-xr-x",owner:shellState.user,group:shellState.user,modified:now.toLocaleString()}; }
                continue;
            }
            if (!ensureParent(path)) return fail(command + ": cannot create '" + operand + "': No such directory");
            if (command === "mkdir") {
                if (virtualFS[path]) return fail("mkdir: cannot create directory '" + operand + "': File exists");
                virtualFS[path] = {type:"dir",mode:"drwxr-xr-x",owner:shellState.user,group:shellState.user,modified:now.toLocaleString()};
            } else if (virtualFS[path]) {
                if (virtualFS[path].type === "file") virtualFS[path].modified = now.toLocaleString();
            } else virtualFS[path] = {type:"file",mode:"-rw-r--r--",owner:shellState.user,group:shellState.user,content:"",modified:now.toLocaleString()};
        }
        return "";
    }
    if (command === "rm") {
        if (!operands.length) return fail("rm: missing operand");
        for (const operand of operands) {
            const path = normalizePath(operand);
            if (!virtualFS[path]) return fail("rm: cannot remove '" + operand + "': No such file or directory");
            if (path === "/" || path === shellState.env.HOME) return fail("rm: refusing to remove protected virtual directory");
            const descendants = Object.keys(virtualFS).filter(k => k.startsWith(path + "/"));
            if (virtualFS[path].type === "dir" && descendants.length && !args.some(a => a === "-r" || a === "-rf" || a === "-fr" || a === "--recursive")) return fail("rm: cannot remove '" + operand + "': Is a directory (try rm -r)");
            descendants.forEach(k => delete virtualFS[k]); delete virtualFS[path];
        }
        return "";
    }
    if (command === "cp" || command === "mv") {
        const source = operands[0], destination = operands[1];
        if (!source || !destination) return fail(command + ": missing file operand");
        const src = normalizePath(source), dst = normalizePath(destination), node = virtualFS[src];
        if (!node) return fail(command + ": cannot stat '" + source + "': No such file or directory");
        if (node.type === "dir" && !args.includes("-r") && !args.includes("-R")) return fail(command + ": -r not specified; omitting directory '" + source + "'");
        const finalDest = virtualFS[dst]?.type === "dir" ? dst + "/" + baseName(src) : dst;
        if (!ensureParent(finalDest)) return fail(command + ": cannot create '" + destination + "': No such directory");
        const copyNode = key => ({...virtualFS[key]});
        virtualFS[finalDest] = copyNode(src);
        if (node.type === "dir") {
            Object.keys(virtualFS).filter(k => k.startsWith(src + "/")).sort((a,b) => a.length-b.length).forEach(k => virtualFS[finalDest + k.slice(src.length)] = copyNode(k));
        }
        if (command === "mv") {
            Object.keys(virtualFS).filter(k => k === src || k.startsWith(src + "/")).forEach(k => delete virtualFS[k]);
        }
        return "";
    }
    if (command === "stat") {
        if (!args[0]) return fail("stat: missing operand");
        const path = normalizePath(args[0]), n = virtualFS[path];
        if (!n) return fail("stat: cannot statx '" + args[0] + "': No such file or directory");
        return "  File: " + path + "\n  Size: " + (n.content || "").length + "\tBlocks: 8\tIO Block: 4096 " + (n.type === "dir" ? "directory" : "regular file") + "\nDevice: websim\tInode: " + (Object.keys(virtualFS).indexOf(path)+1) + "\tLinks: 1\nAccess: (" + n.mode + ")  Uid: (" + n.owner + ")  Gid: (" + n.group + ")\nModify: " + n.modified + "\n(simulated metadata)";
    }
    if (command === "file") return fileArgs.map(f => {
        const n = virtualFS[normalizePath(f)];
        return f + ": " + (!n ? "cannot open (No such file or directory)" : n.type === "dir" ? "directory" : "ASCII text");
    }).join("\n") || fail("file: missing file operand");
    if (command === "chmod") {
        if (args.length < 2) return fail("chmod: missing operand");
        const mode = args[0], path = normalizePath(args[1]), n = virtualFS[path];
        if (!n) return fail("chmod: cannot access '" + args[1] + "': No such file or directory");
        n.mode = mode.replace(/[0-7]/g, "").length === 0 && /^[0-7]{3,4}$/.test(mode) ? "-" + mode + " (simulated)" : mode + " (simulated)";
        return "Permissions updated in virtual metadata only.";
    }
    if (command === "grep") {
        const pattern = args.find(a => !a.startsWith("-"));
        const files = args.filter(a => !a.startsWith("-") && a !== pattern);
        if (!pattern || !files.length) return fail("usage: grep [-in] PATTERN FILE...");
        const out = [];
        for (const file of files) {
            try {
                readVirtualFile(file).split("\n").forEach((line,i) => {
                    const match = args.includes("-i") ? line.toLowerCase().includes(pattern.toLowerCase()) : line.includes(pattern);
                    if (match) out.push((files.length > 1 ? file + ":" : "") + (args.includes("-n") ? (i+1) + ":" : "") + line);
                });
            } catch (e) { out.push("grep: " + file + ": " + e.message); }
        }
        return out.join("\n") || fail("");
    }
    if (command === "head" || command === "tail") {
        const nIndex = args.findIndex(a => a === "-n" || a === "--lines");
        const count = nIndex >= 0 ? Math.max(0, Math.min(100, Number(args[nIndex+1]) || 10)) : 10;
        const file = args.find((a,i) => !a.startsWith("-") && !(nIndex >= 0 && i === nIndex+1));
        if (!file) return fail(command + ": missing file operand");
        try {
            const lines = readVirtualFile(file).split("\n");
            return (command === "head" ? lines.slice(0,count) : lines.slice(-count)).join("\n");
        } catch (e) { return fail(command + ": " + file + ": " + e.message); }
    }
    if (command === "wc") {
        if (!fileArgs.length) return fail("wc: missing file operand");
        return fileArgs.map(file => {
            try {
                const text = readVirtualFile(file), lines = text ? text.split("\n").length : 0;
                const words = (text.match(/\S+/g) || []).length, bytes = new TextEncoder().encode(text).length;
                const vals = [];
                if (!flags.length || flags.includes("-l")) vals.push(lines);
                if (flags.includes("-w")) vals.push(words);
                if (flags.includes("-c")) vals.push(bytes);
                return vals.join(" ").padStart(8) + " " + file;
            } catch (e) { return "wc: " + file + ": " + e.message; }
        }).join("\n");
    }
    if (command === "find") {
        const root = normalizePath(args.find(a => !a.startsWith("-") && a !== "find") || ".");
        if (!virtualFS[root]) return fail("find: '" + root + "': No such file or directory");
        const nameIndex = args.indexOf("-name");
        const pattern = nameIndex >= 0 ? (args[nameIndex+1] || "*") : "*";
        const regex = new RegExp("^" + pattern.split("*").map(x => x.replace(/[.*+?^{}()|[\]\\]/g,"\\$&")).join(".*").replace(/\?/g,".") + "$");
        return Object.keys(virtualFS).filter(k => (k === root || k.startsWith(root === "/" ? "/" : root + "/")) && regex.test(baseName(k))).sort().join("\n");
    }
    if (command === "projects") return "PROJECT DIRECTORY // PUBLIC\n[P-001] mOS — pocket-sized OS concept\n[P-002] Mission Link — LoRa mesh networking\n[P-003] UNKNOWN SIGNAL — access restricted";
    if (command === "about") return "TEAM BLACKLIGHT\nAn independent gaming and development collective.\nWe build games, software, hardware, and experiments.\nCreativity has no permissions.";
    if (command === "status") return "Website: ONLINE\nTerminal: OPERATIONAL\nShell: SIMULATED\nStore: PREVIEW MODE\nPayments: NOT CONFIGURED";
    if (command === "store") return "TEAM BLACKLIGHT SUPPLY\nStorefront status: PREVIEW. No purchases or payments are enabled.";
    if (command === "contact") return "COMMUNICATION DIRECTORY\nOfficial contact channels have not been configured yet.";
    if (command === "secret") return "...SIGNAL DETECTED...\nYou're looking in the right places.\nSIGNAL FRAGMENT 001 // THE LIGHT IS NOT THE SOURCE.";
    if (command === "account") { terminalHTML('<p class="terminal-system">MEMBER ACCESS</p><p>Opening the account interface...</p><p><a href="#account">ACCESS ACCOUNT PANEL ↗</a></p>'); return ""; }
    if (command === "true") return "";
    if (command === "false") { shellState.lastStatus = 1; return ""; }
    if (command === "which" || command === "command") {
        const available = ["ls","pwd","cd","cat","echo","printf","grep","head","tail","wc","find","touch","mkdir","cp","mv","rm","tree","uname","whoami","id","date","uptime","ps","df","free","env","history","sudo","apt","help"];
        const name = args[0];
        return name ? (available.includes(name) ? "/usr/bin/" + name : name + " not found") : "command: usage: command [-v] NAME";
    }
    return fail("bash: " + command + ": command not found. Try 'help' to see supported commands.");
}

function runCommand(rawCommand) {
    const input = rawCommand.trim();
    if (!input) return;
    shellState.history.push(input);
    shellState.historyIndex = shellState.history.length;
    const prompt = document.createElement("p");
    prompt.innerHTML = '<span class="terminal-highlight">' + escapeHTML(shellState.user + "@" + shellState.host + ":" + shellState.cwd.replace(shellState.env.HOME, "~")) + "$</span> " + escapeHTML(input);
    terminalOutput.appendChild(prompt);
    const result = runShellCommand(input);
    shellState.lastStatus = shellState.lastStatus || 0;
    if (result !== undefined && result !== null && result !== "") terminalPre(result);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

if (terminalForm && terminalInput && terminalOutput) {
    terminalForm.addEventListener("submit", event => {
        event.preventDefault();
        runCommand(terminalInput.value);
        terminalInput.value = "";
        terminalInput.focus();
    });
    terminalInput.addEventListener("keydown", event => {
        if (event.key === "ArrowUp") {
            event.preventDefault();
            if (shellState.historyIndex > 0) shellState.historyIndex--;
            terminalInput.value = shellState.history[shellState.historyIndex] || "";
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            if (shellState.historyIndex < shellState.history.length) shellState.historyIndex++;
            terminalInput.value = shellState.history[shellState.historyIndex] || "";
        } else if (event.key === "Tab") {
            event.preventDefault();
            const partial = terminalInput.value.trim().split(/\s+/).pop() || "";
            const options = [...new Set([...Object.keys(virtualFS).map(baseName), "help","ls","cd","pwd","cat","touch","mkdir","cp","mv","rm","grep","head","tail","wc","find","tree","uname","whoami","id","date","uptime","ps","df","free","env","history","sudo","apt","projects","about","status","store","contact","account","secret"])].filter(item => item.startsWith(partial)).sort();
            if (options.length === 1) terminalInput.value = terminalInput.value.slice(0, terminalInput.value.lastIndexOf(partial)) + options[0] + " ";
            else if (options.length > 1) terminalPrint(options.join("    "), "terminal-system");
        }
    });
}


// ============================================
// TEAM BLACKLIGHT — SUPABASE AUTHENTICATION
// ============================================

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const logoutButton = document.getElementById("logout-button");

const accountStatus = document.getElementById("account-status");
const authForms = document.getElementById("auth-forms");
const accountDetails = document.getElementById("account-details");
const accountName = document.getElementById("account-name");
const accountEmail = document.getElementById("account-email");
const accountRole = document.getElementById("account-role");

const supabaseClient = window.tbSupabase;
const staffDashboard = document.getElementById("control");
const staffRoster = document.getElementById("staff-roster");
const rosterStatus = document.getElementById("roster-status");
const refreshRosterButton = document.getElementById("refresh-roster");

let activeStaffUser = null;
let activeStaffProfile = null;

function hideStaffDashboard() {
    if (staffDashboard) staffDashboard.hidden = true;
    if (staffRoster) staffRoster.replaceChildren();
}


function setAccountMessage(message, isError = false) {
    if (!accountStatus) return;

    accountStatus.textContent = message;
    accountStatus.classList.toggle("error", isError);
}

function showSignedOut() {
    if (authForms) authForms.hidden = false;
    if (accountDetails) accountDetails.hidden = true;
    hideStaffDashboard();
}

function showSignedIn(user, profile) {
    if (authForms) authForms.hidden = true;
    if (accountDetails) accountDetails.hidden = false;

    // textContent prevents profile values from being interpreted as HTML.
    accountName.textContent =
        profile?.display_name?.trim() || user.email || "Team Blacklight Member";

    accountEmail.textContent = user.email || "Email unavailable";

    // The role comes from the protected database profile, not a form.
    const allowedRoles = ["member", "admin", "overseer"];
    const role = allowedRoles.includes(profile?.role)
        ? profile.role
        : "member";

    accountRole.textContent = role.toUpperCase();
    setAccountMessage("Session active. Welcome to Team Blacklight.");
    hideStaffDashboard();
}

async function loadCurrentProfile(user) {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Profile lookup failed:", error.message);
        showSignedIn(user, null);
        setAccountMessage(
            "Signed in, but your profile could not be loaded. Check your Supabase profile policies.",
            true
        );
        return;
    }

    if (!data) {
        showSignedIn(user, null);
        setAccountMessage(
            "Signed in, but no profile was found. Check that the new-user profile trigger is installed.",
            true
        );
        return;
    }

    showSignedIn(user, data);
    await renderStaffDashboard(user, data);
}

async function refreshSession() {
    if (!supabaseClient) {
        showSignedOut();
        setAccountMessage(
            "Supabase is not configured. Check supabase-config.js and the script loading order.",
            true
        );
        return;
    }

    setAccountMessage("Checking your session...");

    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
        showSignedOut();
        setAccountMessage(error.message, true);
        return;
    }

    if (data.session?.user) {
        await loadCurrentProfile(data.session.user);
    } else {
        showSignedOut();
        setAccountMessage(
            "Not signed in. Create an account or log in to continue."
        );
    }
}

if (!supabaseClient) {
    showSignedOut();
    setAccountMessage(
        "Supabase connection missing. Ensure supabase-config.js loads before script.js.",
        true
    );
} else {
    // Create account
    signupForm?.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(signupForm);
        const displayName = String(formData.get("display_name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");

        if (!displayName || displayName.length > 60) {
            setAccountMessage("Enter a display name of 1–60 characters.", true);
            return;
        }

        const submitButton = signupForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        setAccountMessage("Creating your account...");

        try {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        display_name: displayName
                    }
                }
            });

            if (error) throw error;

            if (data.session && data.user) {
                await loadCurrentProfile(data.user);
                signupForm.reset();
            } else {
                setAccountMessage(
                    "Account request received. Check your email for a verification link, then log in."
                );
                signupForm.reset();
            }
        } catch (error) {
            setAccountMessage(error.message || "Account creation failed.", true);
        } finally {
            submitButton.disabled = false;
        }
    });

    // Log in
    loginForm?.addEventListener("submit", async event => {
        event.preventDefault();

        const formData = new FormData(loginForm);
        const email = String(formData.get("email") || "").trim();
        const password = String(formData.get("password") || "");

        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        setAccountMessage("Authenticating...");

        try {
            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            await loadCurrentProfile(data.user);
            loginForm.reset();
        } catch (error) {
            setAccountMessage(
                error.message || "Login failed. Check your credentials.",
                true
            );
        } finally {
            submitButton.disabled = false;
        }
    });

    // Log out
    logoutButton?.addEventListener("click", async () => {
        logoutButton.disabled = true;
        setAccountMessage("Signing out...");

        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            showSignedOut();
            setAccountMessage("Signed out successfully.");
        } catch (error) {
            setAccountMessage(error.message || "Sign-out failed.", true);
        } finally {
            logoutButton.disabled = false;
        }
    });

    // Restore existing sessions and react to login/logout events.
    supabaseClient.auth.onAuthStateChange((event, session) => {
        if (event === "INITIAL_SESSION") {
            if (session?.user) {
                // Defer profile lookup to avoid doing additional Supabase
                // calls inside the auth event callback.
                setTimeout(() => loadCurrentProfile(session.user), 0);
            } else {
                showSignedOut();
                setAccountMessage(
                    "Not signed in. Create an account or log in to continue."
                );
            }
        }

        if (event === "SIGNED_IN" && session?.user) {
            setTimeout(() => loadCurrentProfile(session.user), 0);
        }

        if (event === "SIGNED_OUT") {
            showSignedOut();
            setAccountMessage("Signed out successfully.");
        }
    });

    refreshSession();
}


/* ==========================================
   TEAM BLACKLIGHT CONTROL
   Database-authorized staff dashboard
   ========================================== */

async function renderStaffDashboard(user, profile) {
    activeStaffUser = user;
    activeStaffProfile = profile;

    if (
        !profile ||
        !["admin", "overseer"].includes(profile.role)
    ) {
        hideStaffDashboard();
        return;
    }

    staffDashboard.hidden = false;
    await loadStaffRoster();
}

async function loadStaffRoster() {
    if (!activeStaffUser || !activeStaffProfile) return;

    if (!["admin", "overseer"].includes(activeStaffProfile.role)) {
        hideStaffDashboard();
        return;
    }

    rosterStatus.textContent = "Loading personnel records...";
    staffRoster.replaceChildren();

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, display_name, role, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        rosterStatus.textContent =
            "Unable to load roster. Check staff profile permissions.";
        console.error("Roster query failed:", error.message);
        return;
    }

    if (!data || data.length === 0) {
        rosterStatus.textContent = "No member profiles found.";
        return;
    }

    rosterStatus.textContent =
        `${data.length} profile${data.length === 1 ? "" : "s"} loaded.`;

    for (const member of data) {
        const row = document.createElement("article");
        row.className = "staff-member";

        const identity = document.createElement("div");
        identity.className = "staff-member-identity";

        const name = document.createElement("strong");
        name.textContent =
            member.display_name?.trim() || "Unnamed member";

        const joined = document.createElement("span");
        joined.className = "staff-member-meta";

        const joinedDate = member.created_at
            ? new Date(member.created_at).toLocaleDateString()
            : "Unknown";

        joined.textContent = `Joined: ${joinedDate}`;

        identity.append(name, joined);

        const controls = document.createElement("div");
        controls.className = "staff-member-controls";

        const currentRole = document.createElement("span");
        currentRole.className = "staff-role";
        currentRole.textContent = String(member.role).toUpperCase();

        controls.append(currentRole);

        const canManageRoles =
            activeStaffProfile.role === "overseer" &&
            member.id !== activeStaffUser.id;

        if (canManageRoles) {
            const roleSelect = document.createElement("select");
            roleSelect.className = "staff-role-select";
            roleSelect.setAttribute(
                "aria-label",
                `Change role for ${member.display_name || "unnamed member"}`
            );

            for (const role of ["member", "admin", "overseer"]) {
                const option = document.createElement("option");
                option.value = role;
                option.textContent = role.toUpperCase();
                option.selected = role === member.role;
                roleSelect.append(option);
            }

            roleSelect.addEventListener("change", async () => {
                const requestedRole = roleSelect.value;

                roleSelect.disabled = true;
                rosterStatus.textContent = "Updating role...";

                try {
                    const { error: roleError } =
                        await supabaseClient.rpc(
                            "admin_set_member_role",
                            {
                                p_target_user_id: member.id,
                                p_new_role: requestedRole
                            }
                        );

                    if (roleError) throw roleError;

                    rosterStatus.textContent =
                        `Role updated for ${member.display_name || "member"}.`;

                    await loadStaffRoster();
                } catch (error) {
                    console.error("Role update failed:", error.message);

                    rosterStatus.textContent =
                        error.message || "Role update failed.";

                    roleSelect.value = member.role;
                    roleSelect.disabled = false;
                }
            });

            controls.append(roleSelect);
        }

        row.append(identity, controls);
        staffRoster.append(row);
    }
}

refreshRosterButton?.addEventListener("click", () => {
    loadStaffRoster();
});

/* ==========================================
   TEAM BLACKLIGHT CONTROL — MANAGEMENT TOOLS
   ========================================== */

const controlActivity = [];
let controlEventsReady = false;

function recordControlActivity(message) {
    const time = new Date().toLocaleTimeString();
    controlActivity.unshift({ time, message });
    controlActivity.length = Math.min(controlActivity.length, 50);

    const list = document.getElementById("control-activity-list");
    if (list) renderControlActivity();
}

function renderControlActivity() {
    const list = document.getElementById("control-activity-list");
    if (!list) return;

    list.replaceChildren();

    if (!controlActivity.length) {
        const empty = document.createElement("p");
        empty.textContent = "No activity recorded in this session yet.";
        list.append(empty);
        return;
    }

    for (const entry of controlActivity) {
        const row = document.createElement("article");
        row.className = "control-record";

        const time = document.createElement("span");
        time.className = "control-record-meta";
        time.textContent = entry.time;

        const message = document.createElement("p");
        message.textContent = entry.message;

        row.append(time, message);
        list.append(row);
    }
}

function setControlPanel(panelName) {
    const allowed = ["overview", "projects", "store", "members", "activity"];
    if (!allowed.includes(panelName)) return;

    for (const panel of allowed) {
        const element = document.getElementById(`panel-${panel}`);
        const tab = document.querySelector(`.control-tab[data-panel="${panel}"]`);

        if (element) element.hidden = panel !== panelName;
        if (tab) {
            tab.classList.toggle("active", panel === panelName);
            tab.setAttribute("aria-current", panel === panelName ? "page" : "false");
        }
    }

    if (panelName === "projects") loadControlProjects();
    if (panelName === "store") loadControlProducts();
    if (panelName === "members") loadStaffRoster();
    if (panelName === "activity") renderControlActivity();
}

function staffCanManageContent() {
    return Boolean(
        activeStaffUser &&
        activeStaffProfile &&
        ["admin", "overseer"].includes(activeStaffProfile.role)
    );
}

function controlMessage(id, message, isError = false) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("error", isError);
}

function safeSlug(value) {
    return value.trim().toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function addControlRecord(container, titleText, detailText, actions = []) {
    const list = document.getElementById(container);
    if (!list) return;

    const row = document.createElement("article");
    row.className = "control-record";

    const body = document.createElement("div");
    body.className = "control-record-body";

    const title = document.createElement("strong");
    title.textContent = titleText;

    const detail = document.createElement("p");
    detail.textContent = detailText;

    body.append(title, detail);
    row.append(body);

    if (actions.length) {
        const actionArea = document.createElement("div");
        actionArea.className = "control-record-actions";

        for (const action of actions) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "button secondary";
            button.textContent = action.label;
            button.addEventListener("click", action.run);
            actionArea.append(button);
        }

        row.append(actionArea);
    }

    list.append(row);
}

function resetProjectForm() {
    document.getElementById("project-form").reset();
    document.getElementById("project-id").value = "";
    document.getElementById("project-form-heading").textContent = "CREATE PROJECT";
}

function editProject(project) {
    document.getElementById("project-id").value = project.id;
    document.getElementById("project-title").value = project.title || "";
    document.getElementById("project-slug").value = project.slug || "";
    document.getElementById("project-summary").value = project.summary || "";
    document.getElementById("project-description").value = project.description || "";
    document.getElementById("project-status").value = project.status || "planned";
    document.getElementById("project-published").checked = Boolean(project.is_published);
    document.getElementById("project-form-heading").textContent = "EDIT PROJECT";
    document.getElementById("panel-projects").scrollIntoView({ behavior: "smooth" });
}

async function loadControlProjects() {
    if (!staffCanManageContent()) return;

    const list = document.getElementById("project-list");
    list.replaceChildren();
    controlMessage("project-status-message", "Loading projects...");

    const { data, error } = await supabaseClient
        .from("projects")
        .select("id, title, slug, summary, description, status, is_published, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        controlMessage("project-status-message", error.message, true);
        return;
    }

    controlMessage(
        "project-status-message",
        `${data.length} project${data.length === 1 ? "" : "s"} loaded.`
    );

    if (!data.length) {
        addControlRecord("project-list", "No projects yet", "Create the first project using the form above.");
        return;
    }

    for (const project of data) {
        addControlRecord(
            "project-list",
            project.title,
            `${project.slug} • ${project.status} • ${project.is_published ? "Published" : "Draft"}`,
            [
                { label: "EDIT", run: () => editProject(project) },
                {
                    label: project.is_published ? "UNPUBLISH" : "PUBLISH",
                    run: () => setProjectPublished(project, !project.is_published)
                },
                { label: "DELETE", run: () => deleteControlProject(project) }
            ]
        );
    }
}

async function saveControlProject(event) {
    event.preventDefault();
    if (!staffCanManageContent()) return;

    const id = document.getElementById("project-id").value;
    const title = document.getElementById("project-title").value.trim();
    const slug = safeSlug(document.getElementById("project-slug").value);
    const summary = document.getElementById("project-summary").value.trim();
    const description = document.getElementById("project-description").value.trim();
    const status = document.getElementById("project-status").value;
    const is_published = document.getElementById("project-published").checked;

    if (!title || !slug) {
        controlMessage("project-status-message", "Title and slug are required.", true);
        return;
    }

    const payload = { title, slug, summary, description, status, is_published };
    controlMessage("project-status-message", "Saving project...");

    const result = id
        ? await supabaseClient.from("projects").update(payload).eq("id", id)
        : await supabaseClient.from("projects").insert({
            ...payload,
            created_by: activeStaffUser.id
        });

    if (result.error) {
        controlMessage("project-status-message", result.error.message, true);
        return;
    }

    recordControlActivity(`${id ? "Updated" : "Created"} project: ${title}`);
    resetProjectForm();
    await loadControlProjects();
    controlMessage("project-status-message", `Saved project: ${title}`);
}

async function setProjectPublished(project, is_published) {
    if (!staffCanManageContent()) return;

    const { error } = await supabaseClient
        .from("projects")
        .update({ is_published })
        .eq("id", project.id);

    if (error) {
        controlMessage("project-status-message", error.message, true);
        return;
    }

    recordControlActivity(`${is_published ? "Published" : "Unpublished"} project: ${project.title}`);
    await loadControlProjects();
}

async function deleteControlProject(project) {
    if (!staffCanManageContent()) return;
    if (!confirm(`Delete project "${project.title}"? This cannot be undone.`)) return;

    const { error } = await supabaseClient
        .from("projects")
        .delete()
        .eq("id", project.id);

    if (error) {
        controlMessage("project-status-message", error.message, true);
        return;
    }

    recordControlActivity(`Deleted project: ${project.title}`);
    await loadControlProjects();
}

function resetProductForm() {
    document.getElementById("product-form").reset();
    document.getElementById("product-id").value = "";
    document.getElementById("product-form-heading").textContent = "CREATE PRODUCT";
}

function editProduct(product) {
    document.getElementById("product-id").value = product.id;
    document.getElementById("product-name").value = product.name || "";
    document.getElementById("product-slug").value = product.slug || "";
    document.getElementById("product-description").value = product.description || "";
    document.getElementById("product-price").value =
        (Number(product.price_cents) / 100).toFixed(2);
    document.getElementById("product-stock").value = product.stock_quantity ?? 0;
    document.getElementById("product-image").value = product.image_path || "";
    document.getElementById("product-published").checked = Boolean(product.is_published);
    document.getElementById("product-form-heading").textContent = "EDIT PRODUCT";
    document.getElementById("panel-store").scrollIntoView({ behavior: "smooth" });
}

async function loadControlProducts() {
    if (!staffCanManageContent()) return;

    const list = document.getElementById("product-list");
    list.replaceChildren();
    controlMessage("product-status-message", "Loading products...");

    const { data, error } = await supabaseClient
        .from("products")
        .select("id, name, slug, description, price_cents, currency, image_path, stock_quantity, is_published, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        controlMessage("product-status-message", error.message, true);
        return;
    }

    controlMessage(
        "product-status-message",
        `${data.length} product${data.length === 1 ? "" : "s"} loaded.`
    );

    if (!data.length) {
        addControlRecord("product-list", "No products yet", "Create the first product using the form above.");
        return;
    }

    for (const product of data) {
        addControlRecord(
            "product-list",
            product.name,
            `$${(Number(product.price_cents) / 100).toFixed(2)} ${product.currency} • Stock: ${product.stock_quantity} • ${product.is_published ? "Published" : "Draft"}`,
            [
                { label: "EDIT", run: () => editProduct(product) },
                {
                    label: product.is_published ? "UNPUBLISH" : "PUBLISH",
                    run: () => setProductPublished(product, !product.is_published)
                },
                { label: "DELETE", run: () => deleteControlProduct(product) }
            ]
        );
    }
}

async function saveControlProduct(event) {
    event.preventDefault();
    if (!staffCanManageContent()) return;

    const id = document.getElementById("product-id").value;
    const name = document.getElementById("product-name").value.trim();
    const slug = safeSlug(document.getElementById("product-slug").value);
    const description = document.getElementById("product-description").value.trim();
    const price = Number(document.getElementById("product-price").value);
    const stock = Number(document.getElementById("product-stock").value);
    const image_path = document.getElementById("product-image").value.trim() || null;
    const is_published = document.getElementById("product-published").checked;

    if (!name || !slug || !Number.isFinite(price) || price < 0 ||
        !Number.isInteger(stock) || stock < 0) {
        controlMessage("product-status-message", "Check the name, slug, price, and stock values.", true);
        return;
    }

    const payload = {
        name,
        slug,
        description,
        price_cents: Math.round(price * 100),
        currency: "CAD",
        stock_quantity: stock,
        image_path,
        is_published
    };

    controlMessage("product-status-message", "Saving product...");

    const result = id
        ? await supabaseClient.from("products").update(payload).eq("id", id)
        : await supabaseClient.from("products").insert({
            ...payload,
            created_by: activeStaffUser.id
        });

    if (result.error) {
        controlMessage("product-status-message", result.error.message, true);
        return;
    }

    recordControlActivity(`${id ? "Updated" : "Created"} product: ${name}`);
    resetProductForm();
    await loadControlProducts();
    controlMessage("product-status-message", `Saved product: ${name}`);
}

async function setProductPublished(product, is_published) {
    if (!staffCanManageContent()) return;

    const { error } = await supabaseClient
        .from("products")
        .update({ is_published })
        .eq("id", product.id);

    if (error) {
        controlMessage("product-status-message", error.message, true);
        return;
    }

    recordControlActivity(`${is_published ? "Published" : "Unpublished"} product: ${product.name}`);
    await loadControlProducts();
}

async function deleteControlProduct(product) {
    if (!staffCanManageContent()) return;
    if (!confirm(`Delete product "${product.name}"? This cannot be undone.`)) return;

    const { error } = await supabaseClient
        .from("products")
        .delete()
        .eq("id", product.id);

    if (error) {
        controlMessage("product-status-message", error.message, true);
        return;
    }

    recordControlActivity(`Deleted product: ${product.name}`);
    await loadControlProducts();
}

function setupControlConsole() {
    if (controlEventsReady) return;
    controlEventsReady = true;

    document.querySelectorAll(".control-tab").forEach(button => {
        button.addEventListener("click", () => setControlPanel(button.dataset.panel));
    });

    document.querySelectorAll("[data-open-panel]").forEach(button => {
        button.addEventListener("click", () => setControlPanel(button.dataset.openPanel));
    });

    document.getElementById("project-form")?.addEventListener("submit", saveControlProject);
    document.getElementById("product-form")?.addEventListener("submit", saveControlProduct);
    document.getElementById("refresh-projects")?.addEventListener("click", loadControlProjects);
    document.getElementById("refresh-products")?.addEventListener("click", loadControlProducts);
    document.getElementById("cancel-project-edit")?.addEventListener("click", resetProjectForm);
    document.getElementById("cancel-product-edit")?.addEventListener("click", resetProductForm);
    document.getElementById("clear-activity")?.addEventListener("click", () => {
        controlActivity.length = 0;
        renderControlActivity();
    });

    renderControlActivity();
}

setupControlConsole();
