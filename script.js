
"use strict";

// ============================================
// TEAM BLACKLIGHT — TERMINAL SIMULATOR
// ============================================
// A small, fictional Linux-style terminal. Commands never access the visitor's device.

const terminalForm = document.getElementById("terminal-form");
const terminalInput = document.getElementById("terminal-input");
const terminalOutput = document.getElementById("terminal-output");

const terminalHistory = [];
let terminalHistoryIndex = 0;

const terminalFiles = {
    "README.txt": "Welcome to the Team Blacklight terminal.\nThis is a small Linux-style simulation running in your browser.\nTry: help, ls, cat README.txt, uname -a, sudo apt update, status, projects.",
    "Documents/policies-draft.txt": "Team Blacklight policies are drafts and have not been formally adopted.",
    "Documents/project-notes.txt": "Build collaboratively. Agree on credit, ownership, and compensation before work begins.",
    "team-blacklight/README.txt": "TEAM BLACKLIGHT // PUBLIC TERMINAL\nProjects: Mission Link, mOS, and experimental software.\nStatus: development."
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
        "  help                 Show available commands",
        "  ls [-la]              List sample files",
        "  cat FILE              Read a sample file",
        "  uname [-a]            Show simulated system information",
        "  sudo apt update       Simulate refreshing package lists",
        "  sudo apt install NAME Preview a package installation",
        "  status                Show website/system status",
        "  projects              List Team Blacklight projects",
        "  history               Show commands entered this session",
        "  clear                 Clear the terminal",
        "",
        "This is a browser simulation. It cannot run real commands,",
        "install software, access your computer, or accept passwords."
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

    switch (command) {
        case "help":
            result = terminalHelp();
            break;
        case "clear":
            terminalOutput.replaceChildren();
            break;
        case "ls": {
            const showHidden = args.some(arg => ["-la", "-al", "-a", "-lah", "-l"].includes(arg));
            const names = ["Documents/", "README.txt", "team-blacklight/"];
            result = showHidden ? "total 3\ndrwxr-xr-x  2 guest guest 4096 Documents/\n-rw-r--r--  1 guest guest  190 README.txt\ndrwxr-xr-x  2 guest guest 4096 team-blacklight/" : names.join("    ");
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
        case "sudo": {
            if (args[0] !== "apt") {
                result = "sudo: only the simulated apt commands are supported here. No password is needed or collected.";
                break;
            }
            const action = args[1];
            if (action === "update") {
                result = [
                    "Hit:1 https://packages.team-blacklight.invalid stable InRelease",
                    "Hit:2 https://archive.ubuntu.invalid stable InRelease",
                    "Reading package lists... Done",
                    "Building dependency tree... Done",
                    "All simulated package lists are up to date."
                ].join("\n");
            } else if (action === "install") {
                const packages = args.slice(2).filter(name => !name.startsWith("-"));
                result = packages.length
                    ? "Package preview: " + packages.join(", ") + "\nSimulation only — no software was installed."
                    : "E: No package specified. Try: sudo apt install <package>";
            } else {
                result = "Supported simulated package commands:\n  sudo apt update\n  sudo apt install <package>";
            }
            break;
        }
        case "apt":
            result = "Permission denied. Try a supported simulated command with sudo, such as: sudo apt update";
            break;
        case "status":
            result = "Website: ONLINE\nTerminal: OPERATIONAL\nShell: SIMULATED\nStore: PREVIEW MODE\nPayments: NOT CONFIGURED";
            break;
        case "projects":
            result = "TEAM BLACKLIGHT // PROJECT DIRECTORY\n• Mission Link — LoRa mesh networking\n• mOS — compact device OS concept\n• Experimental software and games";
            break;
        case "history":
            result = terminalHistory.map((item, index) => String(index + 1).padStart(3) + "  " + item).join("\n");
            break;
        default:
            result = command + ": command not found. Type 'help' to see available commands.";
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
            const commands = ["help", "ls", "cat", "uname", "sudo", "apt", "status", "projects", "history", "clear"];
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
