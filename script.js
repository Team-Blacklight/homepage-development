
"use strict";

// ============================================
// TEAM BLACKLIGHT — TERMINAL SIMULATOR
// ============================================
// A fictional Linux-style terminal with a few hidden Team Blacklight lore trails.
// All commands run locally against this simulator; nothing reaches the visitor's OS.

const terminalForm = document.getElementById("terminal-form");
const terminalInput = document.getElementById("terminal-input");
const terminalOutput = document.getElementById("terminal-output");

const terminalHistory = [];
let terminalHistoryIndex = 0;
let terminalClearance = false;

const terminalFiles = {
    "README.txt": "Welcome to the Team Blacklight terminal.\nThis is a Linux-style simulation running in your browser.\nTry: help, ls, cat README.txt, uname -a, status, projects.",
    "Documents/policies-draft.txt": "Team Blacklight policies are drafts and have not been formally adopted.",
    "Documents/project-notes.txt": "Build collaboratively. Agree on credit, ownership, and compensation before work begins.",
    "team-blacklight/README.txt": "TEAM BLACKLIGHT // PUBLIC TERMINAL\nProjects: Mission Link, mOS, and experimental software.\nStatus: development."
};

const terminalClassified = {
    "/etc/blacklight/manifest.enc": [
        "TB // RESTRICTED MANIFEST",
        "Cipher: TB-7 / local simulation",
        "Payload: [ENCRYPTED]",
        "Routing note: the signal is not coming from the public network.",
        "Fragment: THE LIGHT IS NOT THE SOURCE.",
        "End of recovered text."
    ].join("\n"),
    "/etc/blacklight/transmission.log": [
        "[03:17:08] relay handshake accepted",
        "[03:17:09] source identity: WITHHELD",
        "[03:17:11] packet 001 received",
        "[03:17:11] payload status: ENCRYPTED",
        "[03:17:12] destination: UNKNOWN",
        "[SYSTEM] further records require elevated clearance"
    ].join("\n")
};

function terminalEscape(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function terminalWrite(text, className = "") {
    if (!text) return;
    const output = document.createElement("pre");
    output.className = "terminal-pre" + (className ? " " + className : "");
    output.textContent = String(text);
    terminalOutput.appendChild(output);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function terminalHelp() {
    return [
        "TEAM BLACKLIGHT // LINUX SHELL SIMULATOR",
        "",
        "  help                  Show available commands",
        "  ls [-la]               List public sample files",
        "  cat FILE               Read a public sample file",
        "  uname [-a]             Show simulated system information",
        "  sudo apt update        Simulate refreshing package lists",
        "  sudo apt install NAME Preview a package installation",
        "  sudo projects          View restricted project metadata",
        "  sudo ls /etc/blacklight List restricted records",
        "  sudo cat PATH          Read a restricted record",
        "  status                 Show system status",
        "  projects               List public projects",
        "  secret                 Inspect an anomalous signal",
        "  history                Show commands entered this session",
        "  clear                  Clear the terminal",
        "",
        "Hint: not every transmission is meant for public access.",
        "This is a simulation. No real commands or passwords are used."
    ].join("\n");
}

function terminalRun(raw) {
    const input = raw.trim();
    if (!input) return;

    terminalHistory.push(input);
    terminalHistoryIndex = terminalHistory.length;

    const prompt = document.createElement("p");
    prompt.innerHTML = '<span class="terminal-highlight">guest@team-blacklight:~$</span> ' + terminalEscape(input);
    terminalOutput.appendChild(prompt);

    const args = input.match(/"[^"]*"|'[^']*'|\S+/g)?.map(part => part.replace(/^["']|["']$/g, "")) || [];
    const command = args.shift();
    let result = "";

    if (command === "sudo") {
        const elevatedCommand = args.shift();
        if (!elevatedCommand) {
            result = "usage: sudo COMMAND\nSimulation only — no administrator password is needed or accepted.";
        } else if (elevatedCommand === "projects") {
            terminalClearance = true;
            result = [
                "TEAM BLACKLIGHT // PROJECT DIRECTORY",
                "[P-001] mOS — compact device OS concept",
                "[P-002] Mission Link — LoRa mesh networking",
                "[P-003] UNKNOWN SIGNAL — TRANSMISSION ENCRYPTED",
                "",
                "Clearance accepted (simulated). Metadata only; payload remains encrypted.",
                "Hint: inspect /etc/blacklight/ for recovered records."
            ].join("\n");
        } else if (elevatedCommand === "ls" && args[0] === "/etc/blacklight") {
            terminalClearance = true;
            result = "manifest.enc\ntransmission.log\n(Restricted directory listing; simulated clearance.)";
        } else if (elevatedCommand === "cat") {
            const path = args[0] || "";
            if (!terminalClassified[path]) {
                result = "sudo: cannot read '" + path + "': No such restricted file.\nTry: sudo cat /etc/blacklight/manifest.enc";
            } else {
                terminalClearance = true;
                result = terminalClassified[path];
                if (path.endsWith("transmission.log")) result += "\n\n[NOTE] A second packet appears to be missing.";
            }
        } else if (elevatedCommand === "status") {
            terminalClearance = true;
            result = "Website: ONLINE\nTerminal: OPERATIONAL\nPublic services: NOMINAL\nUnlisted relay: RESPONDING\nLast signal: 03:17:11\nPayload: ENCRYPTED";
        } else if (elevatedCommand === "apt") {
            const action = args[0];
            if (action === "update") {
                result = [
                    "Hit:1 https://packages.team-blacklight.invalid stable InRelease",
                    "Hit:2 https://archive.ubuntu.invalid stable InRelease",
                    "Reading package lists... Done",
                    "Building dependency tree... Done",
                    "All simulated package lists are up to date."
                ].join("\n");
            } else if (action === "install") {
                const packages = args.slice(1).filter(name => !name.startsWith("-"));
                result = packages.length
                    ? "Package preview: " + packages.join(", ") + "\nSimulation only — no software was installed."
                    : "E: No package specified. Try: sudo apt install <package>";
            } else {
                result = "Supported simulated package commands:\n  sudo apt update\n  sudo apt install <package>";
            }
        } else {
            result = "sudo: command not available in this simulation. Type 'help' for supported elevated commands.";
        }
    } else {
        switch (command) {
            case "help":
                result = terminalHelp();
                break;
            case "clear":
                terminalOutput.replaceChildren();
                break;
            case "ls": {
                const path = args.find(arg => !arg.startsWith("-")) || "~";
                if (path === "/etc/blacklight" || path === "/etc" || path === "/") {
                    result = "Permission denied: restricted system path.";
                } else if (path === "~" || path === "." || path === "/home/guest") {
                    result = args.some(arg => ["-la", "-al", "-a", "-lah", "-l"].includes(arg))
                        ? "total 3\ndrwxr-xr-x  2 guest guest 4096 Documents/\n-rw-r--r--  1 guest guest  190 README.txt\ndrwxr-xr-x  2 guest guest 4096 team-blacklight/"
                        : "Documents/    README.txt    team-blacklight/";
                } else if (path === "Documents" || path === "Documents/") {
                    result = "policies-draft.txt    project-notes.txt";
                } else if (path === "team-blacklight" || path === "team-blacklight/") {
                    result = "README.txt";
                } else {
                    result = "ls: cannot access '" + path + "': No such file or directory";
                }
                break;
            }
            case "cat": {
                if (!args.length) result = "cat: missing file operand";
                else result = args.map(file => Object.prototype.hasOwnProperty.call(terminalFiles, file)
                    ? terminalFiles[file]
                    : "cat: " + file + ": No such file or directory").join("\n");
                break;
            }
            case "uname":
                result = args.includes("-a")
                    ? "Linux team-blacklight 6.8.0-tbl-websim #1 SMP x86_64 GNU/Linux (simulated)"
                    : "Linux";
                break;
            case "apt":
                result = "Permission denied. Try: sudo apt update";
                break;
            case "status":
                result = "Website: ONLINE\nTerminal: OPERATIONAL\nShell: SIMULATED\nStore: PREVIEW MODE\nPayments: NOT CONFIGURED";
                break;
            case "projects":
                result = [
                    "TEAM BLACKLIGHT // PROJECT DIRECTORY",
                    "[P-001] mOS — compact device OS concept",
                    "[P-002] Mission Link — LoRa mesh networking",
                    "[P-003] UNKNOWN SIGNAL — [TRANSMISSION ENCRYPTED]"
                ].join("\n");
                break;
            case "secret":
                result = [
                    "...SIGNAL DETECTED...",
                    "A packet arrived without a sender.",
                    "The public log says nothing happened at 03:17.",
                    "The restricted log says otherwise.",
                    "",
                    "Fragment 001 // THE LIGHT IS NOT THE SOURCE."
                ].join("\n");
                break;
            case "history":
                result = terminalHistory.map((item, index) => String(index + 1).padStart(3) + "  " + item).join("\n");
                break;
            default:
                result = command + ": command not found. Type 'help' to see available commands.";
        }
    }

    terminalWrite(result);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

if (terminalForm && terminalInput && terminalOutput) {
    terminalForm.addEventListener("submit", event => {
        event.preventDefault();
        terminalRun(terminalInput.value);
        terminalInput.value = "";
        terminalInput.focus();
    });

    terminalInput.addEventListener("keydown", event => {
        if (event.key === "ArrowUp") {
            event.preventDefault();
            if (terminalHistoryIndex > 0) terminalHistoryIndex--;
            terminalInput.value = terminalHistory[terminalHistoryIndex] || "";
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            if (terminalHistoryIndex < terminalHistory.length) terminalHistoryIndex++;
            terminalInput.value = terminalHistory[terminalHistoryIndex] || "";
        } else if (event.key === "Tab") {
            event.preventDefault();
            const partial = terminalInput.value.trim().split(/\s+/).pop() || "";
            const commands = ["help", "ls", "cat", "uname", "sudo", "apt", "status", "projects", "secret", "history", "clear"];
            const matches = commands.filter(item => item.startsWith(partial));
            if (matches.length === 1) terminalInput.value = terminalInput.value.slice(0, terminalInput.value.lastIndexOf(partial)) + matches[0] + " ";
            else if (matches.length > 1) terminalWrite(matches.join("    "), "terminal-system");
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
    const allowed = ["overview", "projects", "store", "members", "applications", "activity"];
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

// TEAM BLACKLIGHT — PUBLIC PROJECT & PRODUCT CATALOGUES
// The public site reads only records explicitly published in the staff console.
function publicStatusLabel(status) {
    return String(status || "planned").replace(/_/g, " ").toUpperCase();
}
function renderPublicEmpty(container, title, message) {
    container.replaceChildren();
    const card = document.createElement("article");
    card.className = "project-card public-empty-card";
    const heading = document.createElement("h3"); heading.textContent = title;
    const detail = document.createElement("p"); detail.textContent = message;
    card.append(heading, detail); container.append(card);
}
async function loadPublicProjects() {
    const grid = document.getElementById("public-project-grid");
    const message = document.getElementById("public-projects-message");
    if (!grid) return;
    if (!supabaseClient) {
        renderPublicEmpty(grid, "PROJECT DATABASE OFFLINE", "Project listings are temporarily unavailable.");
        if (message) message.textContent = "Could not connect to the project database.";
        return;
    }
    const { data, error } = await supabaseClient.from("projects")
        .select("id,title,slug,summary,description,status,created_at")
        .eq("is_published", true).order("created_at", { ascending: false });
    if (error) {
        renderPublicEmpty(grid, "PROJECT DATABASE UNAVAILABLE", "Please try refreshing the page later.");
        if (message) message.textContent = "Could not load published projects.";
        return;
    }
    grid.replaceChildren();
    if (!data || data.length === 0) {
        renderPublicEmpty(grid, "NO PUBLIC PROJECTS", "There are no published projects at the moment.");
        if (message) message.textContent = "Only projects marked as published in the admin console appear here.";
        return;
    }
    data.forEach((project, index) => {
        const card = document.createElement("article"); card.className = "project-card";
        const top = document.createElement("div"); top.className = "card-top";
        const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = "TEAM BLACKLIGHT PROJECT";
        const number = document.createElement("span"); number.className = "card-number"; number.textContent = "P-" + String(index + 1).padStart(3, "0");
        top.append(tag, number);
        const icon = document.createElement("div"); icon.className = "project-icon"; icon.setAttribute("aria-hidden", "true"); icon.textContent = "◈";
        const heading = document.createElement("h3"); heading.textContent = project.title || "Untitled project";
        const description = document.createElement("p"); description.textContent = project.summary || project.description || "Project details will be added soon.";
        const bottom = document.createElement("div"); bottom.className = "card-bottom";
        const status = document.createElement("span"); status.textContent = "STATUS: " + publicStatusLabel(project.status);
        const link = document.createElement("a"); link.href = "#terminal"; link.textContent = "INSPECT ↗";
        bottom.append(status, link); card.append(top, icon, heading, description, bottom); grid.append(card);
    });
    if (message) message.textContent = data.length + " published project" + (data.length === 1 ? "" : "s") + " loaded from the project database.";
}
function loadProductImage(imagePath, card) {
    if (!imagePath) return;
    const trimmed = String(imagePath).trim();
    const safe = /^(https?:\/\/|\/|\.\/|\.\.\/|images\/)/i.test(trimmed) && !/^\/\//.test(trimmed);
    if (!safe) return;
    const image = document.createElement("img"); image.className = "product-image"; image.src = trimmed;
    image.alt = ""; image.loading = "lazy";
    image.addEventListener("error", () => image.remove(), { once: true }); card.append(image);
}
async function loadPublicProducts() {
    const grid = document.getElementById("public-product-grid");
    const message = document.getElementById("public-products-message");
    if (!grid) return;
    if (!supabaseClient) {
        renderPublicEmpty(grid, "CATALOGUE OFFLINE", "Product listings are temporarily unavailable.");
        if (message) message.textContent = "Could not connect to the product database.";
        return;
    }
    const { data, error } = await supabaseClient.from("products")
        .select("id,name,slug,description,price_cents,currency,image_path,stock_quantity,created_at")
        .eq("is_published", true).order("created_at", { ascending: false });
    if (error) {
        renderPublicEmpty(grid, "CATALOGUE UNAVAILABLE", "Please try refreshing the page later.");
        if (message) message.textContent = "Could not load published products.";
        return;
    }
    grid.replaceChildren();
    if (!data || data.length === 0) {
        renderPublicEmpty(grid, "NO LISTED PRODUCTS", "The Team Blacklight catalogue is being prepared.");
        if (message) message.textContent = "Only products marked as published in the admin console appear here.";
        return;
    }
    data.forEach(product => {
        const card = document.createElement("article"); card.className = "product-card";
        loadProductImage(product.image_path, card);
        const body = document.createElement("div"); body.className = "product-card-body";
        const tag = document.createElement("p"); tag.className = "eyebrow"; tag.textContent = "TEAM BLACKLIGHT SUPPLY";
        const heading = document.createElement("h3"); heading.textContent = product.name || "Unnamed product";
        const description = document.createElement("p"); description.className = "product-description"; description.textContent = product.description || "Product details will be added soon.";
        const currency = /^[A-Z]{3}$/.test(product.currency || "") ? product.currency : "CAD";
        const price = document.createElement("p"); price.className = "product-price";
        price.textContent = new Intl.NumberFormat("en-CA", { style: "currency", currency }).format((Number(product.price_cents) || 0) / 100);
        const stock = document.createElement("p"); stock.className = "product-stock";
        const quantity = Number(product.stock_quantity) || 0;
        stock.textContent = quantity > 0 ? "STATUS: " + quantity + " IN STOCK" : "STATUS: DEVELOPMENT / OUT OF STOCK";
        stock.classList.toggle("product-stock-available", quantity > 0);
        const preview = document.createElement("span"); preview.className = "product-preview-label"; preview.textContent = "PREVIEW LISTING · PURCHASES DISABLED";
        body.append(tag, heading, description, price, stock, preview); card.append(body); grid.append(card);
    });
    if (message) message.textContent = data.length + " published product" + (data.length === 1 ? "" : "s") + " loaded from the product database.";
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
    document.getElementById("refresh-applications")?.addEventListener("click", loadJoinApplications);
    document.getElementById("cancel-project-edit")?.addEventListener("click", resetProjectForm);
    document.getElementById("cancel-product-edit")?.addEventListener("click", resetProductForm);
    document.getElementById("clear-activity")?.addEventListener("click", () => {
        controlActivity.length = 0;
        renderControlActivity();
    });

    renderControlActivity();
}

setupControlConsole();
loadPublicProjects();
loadPublicProducts();


// TEAM BLACKLIGHT — JOIN APPLICATIONS
const joinForm = document.getElementById("join-application-form");
const joinState = document.getElementById("join-application-state");
const applicationsToggle = document.getElementById("applications-enabled");
let joinApplicationsOpen = false;

function setJoinState(open) {
    joinApplicationsOpen = Boolean(open);
    if (joinState) joinState.hidden = joinApplicationsOpen;
    if (joinForm) joinForm.hidden = !joinApplicationsOpen;
    if (applicationsToggle) {
        applicationsToggle.checked = joinApplicationsOpen;
        const label = document.getElementById("applications-toggle-label");
        if (label) label.textContent = joinApplicationsOpen ? "OPEN" : "CLOSED";
    }
}

async function loadJoinApplicationSetting() {
    if (!supabaseClient) {
        setJoinState(false);
        controlMessage("applications-admin-message", "Supabase unavailable; applications remain closed.", true);
        return;
    }
    const { data, error } = await supabaseClient.from("site_settings")
        .select("value").eq("key", "join_applications_enabled").maybeSingle();
    if (error) {
        setJoinState(false);
        controlMessage("applications-admin-message", "Could not load settings. Run join-applications.sql in Supabase; applications remain closed.", true);
        return;
    }
    setJoinState(data?.value === true);
    controlMessage("applications-admin-message", joinApplicationsOpen ? "Applications are OPEN." : "Applications are CLOSED.");
}

async function saveJoinApplicationSetting() {
    if (!staffCanManageContent()) {
        setJoinState(false);
        controlMessage("applications-admin-message", "Admin or overseer permissions required.", true);
        return;
    }
    const next = applicationsToggle.checked;
    applicationsToggle.disabled = true;
    const { error } = await supabaseClient.from("site_settings").upsert({
        key: "join_applications_enabled", value: next, updated_by: activeStaffUser.id
    }, { onConflict: "key" });
    applicationsToggle.disabled = false;
    if (error) {
        await loadJoinApplicationSetting();
        controlMessage("applications-admin-message", "Could not save the setting. Check the Supabase migration and policies.", true);
        return;
    }
    setJoinState(next);
    controlMessage("applications-admin-message", next ? "Applications are now OPEN." : "Applications are now CLOSED.");
    recordControlActivity("Set team applications " + (next ? "OPEN" : "CLOSED"));
}

async function loadJoinApplications() {
    const list = document.getElementById("applications-inbox");
    const count = document.getElementById("application-count");
    if (!list) return;
    if (!staffCanManageContent()) {
        list.replaceChildren();
        controlMessage("applications-inbox-message", "Admin or overseer permissions required.", true);
        return;
    }
    list.replaceChildren();
    controlMessage("applications-inbox-message", "Loading applications…");
    const { data, error } = await supabaseClient.from("join_applications")
        .select("id,name,email,area,message,portfolio_url,status,created_at")
        .order("created_at", { ascending: false });
    if (error) {
        controlMessage("applications-inbox-message", "Could not load applications. Check the schema and staff read policy.", true);
        if (count) count.textContent = "INBOX UNAVAILABLE";
        return;
    }
    const applications = data || [];
    if (count) count.textContent = applications.length + (applications.length === 1 ? " APPLICATION" : " APPLICATIONS");
    if (!applications.length) {
        const empty = document.createElement("article");
        empty.className = "control-record application-empty";
        const title = document.createElement("h4");
        title.textContent = "NO APPLICATIONS YET";
        const detail = document.createElement("p");
        detail.textContent = joinApplicationsOpen ? "Intake is open. New submissions will appear here." : "The inbox is clear. You can open intake using the toggle above.";
        empty.append(title, detail);
        list.append(empty);
        controlMessage("applications-inbox-message", "Inbox loaded successfully.");
        return;
    }
    for (const application of applications) {
        const card = document.createElement("article");
        card.className = "control-record application-record";
        const top = document.createElement("div");
        top.className = "application-record-top";
        const identity = document.createElement("div");
        const title = document.createElement("h4");
        title.textContent = application.name || "Unnamed applicant";
        const meta = document.createElement("p");
        meta.className = "control-record-meta";
        meta.textContent = (application.created_at ? new Date(application.created_at).toLocaleString() : "Date unavailable") + " · " + (application.area || "Area not provided");
        identity.append(title, meta);
        const badge = document.createElement("span");
        badge.className = "application-status status-" + (application.status || "new");
        badge.textContent = (application.status || "new").replace(/_/g, " ").toUpperCase();
        top.append(identity, badge);
        const email = document.createElement("a");
        email.className = "application-email";
        email.href = "mailto:" + application.email;
        email.textContent = application.email || "No email provided";
        const message = document.createElement("p");
        message.className = "application-message";
        message.textContent = application.message || "";
        card.append(top, email, message);
        if (application.portfolio_url) {
            try {
                const url = new URL(application.portfolio_url);
                if (url.protocol === "https:" || url.protocol === "http:") {
                    const link = document.createElement("a");
                    link.href = url.href; link.target = "_blank"; link.rel = "noopener noreferrer";
                    link.className = "application-portfolio"; link.textContent = "OPEN PORTFOLIO ↗";
                    card.append(link);
                }
            } catch (_) { /* Ignore malformed optional portfolio URLs. */ }
        }
        const actions = document.createElement("div");
        actions.className = "application-review-actions";
        const label = document.createElement("label"); label.textContent = "Review status";
        const select = document.createElement("select");
        select.setAttribute("aria-label", "Review status for " + (application.name || "applicant"));
        for (const [value, labelText] of [["new","New"],["reviewing","Reviewing"],["accepted","Accepted"],["declined","Declined"]]) {
            const option = document.createElement("option"); option.value = value; option.textContent = labelText; select.append(option);
        }
        select.value = application.status || "new";
        const save = document.createElement("button"); save.type = "button"; save.className = "button secondary"; save.textContent = "SAVE STATUS";
        save.addEventListener("click", async () => {
            if (!staffCanManageContent()) { controlMessage("applications-inbox-message", "Admin or overseer permissions required.", true); return; }
            save.disabled = true;
            const { error: updateError } = await supabaseClient.from("join_applications").update({ status: select.value }).eq("id", application.id);
            save.disabled = false;
            if (updateError) { controlMessage("applications-inbox-message", "Status update failed. Run join-applications-review.sql in Supabase and verify staff permissions.", true); return; }
            recordControlActivity("Updated application status for " + (application.name || "applicant") + " to " + select.value);
            controlMessage("applications-inbox-message", "Application status saved.");
            await loadJoinApplications();
        });
        actions.append(label, select, save); card.append(actions); list.append(card);
    }
    controlMessage("applications-inbox-message", "Loaded " + applications.length + (applications.length === 1 ? " application." : " applications."));
}

async function submitJoinApplication(event) {
    event.preventDefault();
    if (!joinApplicationsOpen) {
        setJoinState(false);
        return;
    }
    const button = joinForm.querySelector('button[type="submit"]');
    button.disabled = true;
    controlMessage("join-application-message", "Submitting application…");
    const payload = {
        name: document.getElementById("join-name").value.trim(),
        email: document.getElementById("join-email").value.trim(),
        area: document.getElementById("join-area").value,
        message: document.getElementById("join-message").value.trim(),
        portfolio_url: document.getElementById("join-link").value.trim() || null
    };
    const { error } = await supabaseClient.from("join_applications").insert(payload);
    button.disabled = false;
    if (error) {
        controlMessage("join-application-message", "Submission failed. Intake may have closed, or the database migration may not be installed.", true);
        return;
    }
    joinForm.reset();
    controlMessage("join-application-message", "Application received. Thank you for your interest in Team Blacklight.");
}

if (joinForm) joinForm.addEventListener("submit", submitJoinApplication);
if (applicationsToggle) {
    applicationsToggle.addEventListener("change", saveJoinApplicationSetting);
    loadJoinApplicationSetting();
}
