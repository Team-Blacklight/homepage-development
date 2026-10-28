
"use strict";

// ============================================
// TEAM BLACKLIGHT — TERMINAL
// ============================================

const terminalForm = document.getElementById("terminal-form");
const terminalInput = document.getElementById("terminal-input");
const terminalOutput = document.getElementById("terminal-output");

const shellState = {
    user: "guest",
    host: "team-blacklight",
    cwd: "~",
    history: [],
    historyIndex: 0
};

const commands = {
    help: () => `
        <p class="terminal-system">AVAILABLE COMMANDS // WEB SHELL</p>
        <p><span class="terminal-highlight">help</span> — Show commands</p>
        <p><span class="terminal-highlight">ls [path]</span> — List simulated files</p>
        <p><span class="terminal-highlight">pwd</span> — Show current directory</p>
        <p><span class="terminal-highlight">cd [path]</span> — Change simulated directory</p>
        <p><span class="terminal-highlight">whoami</span> — Show session user</p>
        <p><span class="terminal-highlight">uname [-a]</span> — Show simulated system information</p>
        <p><span class="terminal-highlight">cat [file]</span> — Read a public sample file</p>
        <p><span class="terminal-highlight">echo [text]</span> — Print text</p>
        <p><span class="terminal-highlight">date</span> — Display local date and time</p>
        <p><span class="terminal-highlight">history</span> — Show commands in this session</p>
        <p><span class="terminal-highlight">projects / about / status / store / contact / account</span> — Team Blacklight commands</p>
        <p><span class="terminal-highlight">sudo [command]</span> — Explain privileged-command limits</p>
        <p><span class="terminal-highlight">clear</span> — Clear terminal output</p>
        <p class="terminal-system">NOTE: This is a browser simulation, not a real Linux shell.</p>
    `,

    ls: (args) => {
        const path = args[0] || shellState.cwd;
        const files = {
            "~": ["Desktop/", "Documents/", "Projects/", "README.txt", "team-blacklight/"],
            "/": ["bin/", "dev/", "etc/", "home/", "tmp/", "usr/", "var/"],
            "Projects": ["mission-link/", "mos/", "website/"],
            "Documents": ["policies-draft.txt", "project-notes.txt"],
            "team-blacklight": ["README.txt", "policies/", "projects/"],
            "Desktop": ["Welcome.txt"]
        };
        const key = path.replace(/^\.\//, "").replace(/^\//, "");
        const listing = files[path] || files[key] || (path === "." ? files[shellState.cwd] : null);
        return listing
            ? `<p>${listing.map(escapeHTML).join("&nbsp;&nbsp; ")}</p>`
            : `<p class="terminal-error">ls: cannot access '${escapeHTML(path)}': No such file or directory (simulated)</p>`;
    },

    pwd: () => `<p>/home/guest/${escapeHTML(shellState.cwd === "~" ? "" : shellState.cwd.replace(/^\//, ""))}</p>`,
    whoami: () => `<p>${escapeHTML(shellState.user)}</p>`,
    uname: (args) => args.includes("-a")
        ? "<p>Linux team-blacklight 6.x-web-sim #1 SMP x86_64 GNU/Linux (simulated)</p>"
        : "<p>Linux</p>",

    cd: (args) => {
        const target = args[0] || "~";
        const allowed = ["~", "/", "Desktop", "Documents", "Projects", "team-blacklight"];
        if (target === "..") {
            shellState.cwd = "~";
            return "";
        }
        const normalized = target.replace(/^\.\//, "").replace(/^\//, "");
        if (allowed.includes(target) || allowed.includes(normalized)) {
            shellState.cwd = target.startsWith("/") ? target : (target === "~" ? "~" : normalized);
            return "";
        }
        return `<p class="terminal-error">bash: cd: ${escapeHTML(target)}: No such directory (simulated)</p>`;
    },

    cat: (args) => {
        const file = args[0];
        if (!file) return '<p class="terminal-error">cat: missing file operand</p>';
        const samples = {
            "README.txt": "Welcome to the Team Blacklight web shell. This environment is simulated.",
            "Welcome.txt": "SYSTEM ONLINE. Creativity has no permissions.",
            "policies-draft.txt": "Team Blacklight policies are drafts and are not yet formally adopted.",
            "project-notes.txt": "Projects are developed collaboratively. Record IP ownership and agreements before work begins."
        };
        const content = samples[file] || samples[file.split("/").pop()];
        return content
            ? `<pre class="terminal-pre">${escapeHTML(content)}</pre>`
            : `<p class="terminal-error">cat: ${escapeHTML(file)}: No such file (simulated filesystem)</p>`;
    },

    echo: (args) => `<p>${escapeHTML(args.join(" "))}</p>`,
    date: () => `<p>${escapeHTML(new Date().toLocaleString())}</p>`,
    history: () => shellState.history.length
        ? `<pre class="terminal-pre">${shellState.history.map((item, i) => `${i + 1}  ${escapeHTML(item)}`).join("\n")}</pre>`
        : "<p>Command history is empty.</p>",

    projects: () => `
        <p class="terminal-system">PROJECT DIRECTORY // PUBLIC</p>
        <p>[P-001] mOS — Pocket-sized OS concept</p>
        <p>[P-002] Mission Link — LoRa mesh networking</p>
        <p>[P-003] UNKNOWN SIGNAL — Access restricted</p>
        <p>More projects are being developed.</p>
    `,
    about: () => `
        <p class="terminal-system">TEAM BLACKLIGHT</p>
        <p>An independent gaming and development collective.</p>
        <p>We build games, software, hardware, and experiments.</p>
        <p>Our philosophy: creativity has no permissions.</p>
    `,
    status: () => `
        <p class="terminal-system">SYSTEM STATUS REPORT</p>
        <p>Website: <span class="terminal-highlight">ONLINE</span></p>
        <p>Terminal: <span class="terminal-highlight">OPERATIONAL</span></p>
        <p>Shell: <span class="terminal-highlight">SIMULATED</span></p>
        <p>Store: PREVIEW MODE</p><p>Payment processing: NOT CONFIGURED</p>
        <p>Authentication: CHECK ACCOUNT PANEL</p>
    `,
    store: () => `<p class="terminal-system">TEAM BLACKLIGHT SUPPLY</p><p>Storefront status: PREVIEW.</p><p>No purchases or payments are currently available.</p>`,
    contact: () => `<p class="terminal-system">COMMUNICATION DIRECTORY</p><p>Official contact channels have not been configured yet.</p>`,
    secret: () => `<p class="terminal-system">...SIGNAL DETECTED...</p><p>You're looking in the right places.</p><p class="terminal-highlight">SIGNAL FRAGMENT 001 // "THE LIGHT IS NOT THE SOURCE."</p>`,
    account: () => `<p class="terminal-system">MEMBER ACCESS</p><p>Opening the account interface...</p><p><a href="#account">ACCESS ACCOUNT PANEL ↗</a></p>`
};
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function printToTerminal(html) {
    terminalOutput.insertAdjacentHTML("beforeend", html);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function runCommand(rawCommand) {
    const input = rawCommand.trim();
    if (!input) return;

    shellState.history.push(input);
    shellState.historyIndex = shellState.history.length;
    printToTerminal(
        `<p><span class="terminal-highlight">${escapeHTML(shellState.user)}@team-blacklight:${escapeHTML(shellState.cwd)}$</span> ${escapeHTML(input)}</p>`
    );

    const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const command = (parts.shift() || "").toLowerCase();
    const args = parts.map(part => part.replace(/^"|"$/g, ""));

    if (command === "clear") {
        terminalOutput.replaceChildren();
        return;
    }

    if (command === "sudo") {
        printToTerminal(args.length
            ? '<p class="terminal-error">sudo: this browser terminal cannot run commands on a real computer or grant administrator privileges.</p><p>For safety, it will not collect or request your actual admin password. Run trusted system commands directly in your own Linux terminal.</p>'
            : '<p>Usage: sudo &lt;command&gt;</p><p>This web terminal is simulated; sudo cannot elevate privileges here.</p>');
        return;
    }

    if (command === "apt" || command === "apt-get" || command === "systemctl" ||
        command === "reboot" || command === "shutdown" || command === "rm" ||
        command === "chmod" || command === "chown" || command === "mount") {
        printToTerminal('<p class="terminal-error">' + escapeHTML(command) +
            ': this web shell does not execute operating-system commands.</p>');
        return;
    }

    if (command === "cd") {
        printToTerminal(commands.cd(args));
        return;
    }

    if (commands[command]) {
        const result = commands[command](args);
        if (result) printToTerminal(result);
    } else {
        printToTerminal(
            `<p class="terminal-error">bash: ${escapeHTML(command)}: command not found. Type "help" for available commands.</p>`
        );
    }
}
if (terminalForm && terminalInput && terminalOutput) {
    terminalForm.addEventListener("submit", event => {
        event.preventDefault();
        runCommand(terminalInput.value);
        terminalInput.value = "";
        terminalInput.focus();
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
