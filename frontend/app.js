(function () {
  "use strict";

  // Configure this URL for your local FastAPI backend.
  var API_BASE = "https://portfolio-ai-0j66.onrender.com/";
  var profile = null;
  var chatHistory = [];
  var isSending = false;

  var $ = function (selector) { return document.querySelector(selector); };
  var byId = function (id) { return document.getElementById(id); };
  var first = function () {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined && arguments[i] !== null && arguments[i] !== "") return arguments[i];
    }
    return "";
  };
  var asArray = function (value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      return Object.keys(value).map(function (key) { return { name: key, items: value[key] }; });
    }
    return [];
  };
  var text = function (value) {
    if (value === undefined || value === null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return "";
  };
  var make = function (tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  };
  var addTags = function (container, values) {
    if (!Array.isArray(values) || !values.length) return;
    var row = make("div", "tag-row");
    values.forEach(function (value) {
      var label = typeof value === "string" ? value : first(value && value.name, value && value.title, value && value.description);
      if (label) row.appendChild(make("span", "tag", label));
    });
    container.appendChild(row);
  };

  function setApiStatus(status, label) {
    var node = byId("api-status");
    node.className = "api-indicator " + status;
    node.replaceChildren(document.createElement("span"), document.createTextNode(" " + label));
  }

  function renderExperience(items) {
    var root = byId("experience-list");
    root.replaceChildren();
    if (!items.length) {
      root.appendChild(make("div", "empty-state", "No experience entries are available in the profile API yet."));
      return;
    }
    items.forEach(function (item, index) {
      var article = make("article", "timeline-item");
      var marker = make("span", "timeline-marker");
      var card = make("div", "experience-card");
      var top = make("div", "experience-top");
      var left = make("div");
      left.appendChild(make("h3", "", first(item.position, item.title, item.role, "Software Developer")));
      left.appendChild(make("p", "company-name", first(item.company, item.organization)));
      top.appendChild(left);
      top.appendChild(make("span", "date-pill", [item.start_date, item.end_date].filter(Boolean).join(" — ") || first(item.duration, item.period, "Experience")));
      card.appendChild(top);
      if (item.description) card.appendChild(make("p", "item-description", item.description));
      if (Array.isArray(item.responsibilities) && item.responsibilities.length) {
        var ul = make("ul", "responsibility-list");
        item.responsibilities.forEach(function (responsibility) {
          ul.appendChild(make("li", "", typeof responsibility === "string" ? responsibility : first(responsibility && responsibility.description, "")));
        });
        card.appendChild(ul);
      }
      addTags(card, item.technologies);
      article.appendChild(marker);
      article.appendChild(card);
      root.appendChild(article);
    });
  }

  function renderProjects(items) {
    var root = byId("project-list");
    root.replaceChildren();
    if (!items.length) {
      root.appendChild(make("div", "empty-state", "No projects are available in the profile API yet."));
      return;
    }
    items.forEach(function (project, index) {
      var card = make("article", "project-card");
      var head = make("div", "project-card-head");
      head.appendChild(make("span", "project-index", "PROJECT / " + String(index + 1).padStart(2, "0")));
      head.appendChild(make("span", "", "↗"));
      card.appendChild(head);
      card.appendChild(make("div", "project-symbol", "⌘"));
      card.appendChild(make("h3", "", first(project.name, project.title, "Project")));
      card.appendChild(make("p", "", first(project.description, project.summary, "A practical software project focused on maintainable implementation and useful outcomes.")));
      if (Array.isArray(project.key_features) && project.key_features.length) {
        var ul = make("ul", "feature-list");
        project.key_features.slice(0, 3).forEach(function (feature) {
          ul.appendChild(make("li", "", typeof feature === "string" ? feature : first(feature && feature.name, feature && feature.description, "")));
        });
        card.appendChild(ul);
      }
      addTags(card, project.technologies);
      root.appendChild(card);
    });
  }

  function renderSkills(skills) {
    var root = byId("skills-list");
    root.replaceChildren();
    if (!skills.length) {
      skills = [{ name: "Backend", items: ["Python", "Django", "FastAPI"] }];
    }
    skills.forEach(function (group, index) {
      var name = Array.isArray(group.items) ? group.name : ("Skills " + (index + 1));
      var items = Array.isArray(group.items) ? group.items : [];
      var card = make("article", "skill-card");
      card.appendChild(make("div", "skill-card-icon", index === 0 ? "⌘" : index === 1 ? "⌁" : "⚡"));
      card.appendChild(make("h3", "", name || ("Skills " + (index + 1))));
      var tags = make("div", "skill-tags");
      items.forEach(function (item) {
        var label = typeof item === "string" ? item : first(item && item.name, item && item.title);
        if (label) tags.appendChild(make("span", "", label));
      });
      card.appendChild(tags);
      root.appendChild(card);
    });
  }

  function renderEducation(items) {
    var root = byId("education-list");
    var block = byId("education-block");
    root.replaceChildren();
    if (!items.length) { block.hidden = true; return; }
    block.hidden = false;
    items.forEach(function (item) {
      var line = make("p");
      var degree = make("strong", "", first(item.degree, item.qualification, item.title, "Education"));
      line.appendChild(degree);
      var details = [first(item.institution, item.school, item.university), first(item.year, item.end_date)].filter(Boolean);
      if (details.length) line.appendChild(document.createTextNode(" · " + details.join(" · ")));
      root.appendChild(line);
    });
  }

  function renderProfile(data) {
    profile = data;
    var info = data.personal_information || {};
    var name = first(info.name, data.name, "Sangam Chaurasiya");
    var title = first(info.professional_title, data.professional_title, data.title, "Sr. Python Developer");
    var initials = name.split(/\s+/).map(function (part) { return part.charAt(0); }).slice(0, 2).join("").toUpperCase();
    byId("brand-name").textContent = name.split(" ")[0] + ".";
    byId("footer-brand").textContent = name.split(" ")[0] + ".";
    byId("hero-name").textContent = name;
    byId("hero-title").textContent = title;
    byId("card-name").textContent = name;
    byId("card-title").textContent = title;
    byId("avatar").textContent = initials;
    byId("copyright").textContent = "© " + new Date().getFullYear() + " " + name;
    var summary = first(data.professional_summary, data.summary);
    if (summary) byId("summary").textContent = summary;
    renderExperience(asArray(data.work_experience || data.experience));
    renderProjects(asArray(data.projects));
    renderSkills(asArray(data.technical_skills || data.skills));
    renderEducation(asArray(data.education));
    var chatLabel = document.querySelector(".chat-title p");
    if (chatLabel) {
      chatLabel.replaceChildren(make("span", "status-dot"), document.createTextNode(" Ask me about " + name.split(" ")[0]));
    }
  }

  async function loadProfile() {
    try {
      var response = await fetch(API_BASE + "/profile");
      if (!response.ok) throw new Error("Profile endpoint returned " + response.status);
      var data = await response.json();
      renderProfile(data);
      setApiStatus("connected", "Live profile connected");
    } catch (error) {
      setApiStatus("offline", "Using profile preview");
      // Keep starter content on screen if the API is unavailable.
      renderSkills([{ name: "Languages", items: ["Python", "SQL", "JavaScript"] }, { name: "Backend", items: ["Django", "FastAPI", "REST APIs"] }, { name: "Data & Infrastructure", items: ["PostgreSQL", "MongoDB", "Redis", "Celery"] }, { name: "Tools", items: ["Git", "Docker", "Linux"] }]);
    }
  }

  function openChat() {
    byId("chat-backdrop").hidden = false;
    document.body.style.overflow = "hidden";
    byId("chat-input").focus();
    if (!byId("chat-messages").children.length) {
      addMessage("assistant", "Hi! I’m the portfolio assistant. Ask me about experience, projects, skills, or the kind of work Sangam does.");
    }
  }
  function closeChat() {
    byId("chat-backdrop").hidden = true;
    document.body.style.overflow = "";
  }
  function addMessage(role, content) {
    var root = byId("chat-messages");
    var row = make("div", "message-row " + role);
    row.appendChild(make("div", "message-avatar", role === "assistant" ? "✦" : ((profile && profile.personal_information && profile.personal_information.name) || "SC").split(/\s+/).map(function (x) { return x[0]; }).slice(0, 2).join("").toUpperCase()));
    row.appendChild(make("div", "message-bubble", content));
    root.appendChild(row);
    root.scrollTop = root.scrollHeight;
    byId("suggested-questions").hidden = root.querySelectorAll(".message-row").length > 1;
  }
  function showTyping() {
    var row = make("div", "message-row assistant");
    row.id = "typing-indicator";
    row.appendChild(make("div", "message-avatar", "✦"));
    var bubble = make("div", "message-bubble typing");
    bubble.appendChild(make("span")); bubble.appendChild(make("span")); bubble.appendChild(make("span"));
    row.appendChild(bubble);
    byId("chat-messages").appendChild(row);
    byId("chat-messages").scrollTop = byId("chat-messages").scrollHeight;
  }
  function showChatError(message) {
    var old = byId("chat-error");
    if (old) old.remove();
    byId("chat-messages").appendChild(make("div", "chat-error", message)).id = "chat-error";
    byId("chat-messages").scrollTop = byId("chat-messages").scrollHeight;
  }


async function sendChat(event) {
  event.preventDefault();

  var input = byId("chat-input");
  var question = input.value.trim();

  if (!question || isSending) return;

  isSending = true;
  byId("send-button").disabled = true;
  input.value = "";

  var oldError = byId("chat-error");
  if (oldError) oldError.remove();

  addMessage("user", question);
  showTyping();

  try {
    var response = await fetch(API_BASE + "/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: question,
        history: chatHistory.slice(-12)
      })
    });

    if (!response.ok) {
      var data = await response.json().catch(function () {
        return {};
      });
      throw new Error(
        data.detail || "Request failed (" + response.status + ")"
      );
    }

    if (!response.body) {
      throw new Error("Streaming is not supported by this browser.");
    }

    var typing = byId("typing-indicator");
    if (typing) typing.remove();

    // Create an empty assistant bubble to fill as chunks arrive.
    addMessage("assistant", "");

    var rows = byId("chat-messages").querySelectorAll(
      ".message-row.assistant"
    );
    var assistantRow = rows[rows.length - 1];
    var bubble = assistantRow.querySelector(".message-bubble");

    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var answer = "";

    while (true) {
      var result = await reader.read();
      if (result.done) break;

      answer += decoder.decode(result.value, { stream: true });
      bubble.textContent = answer;

      var chatMessages = byId("chat-messages");
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    answer += decoder.decode();
    bubble.textContent = answer;

    if (!answer.trim()) {
      throw new Error("The assistant returned an empty response.");
    }

    chatHistory.push(
      { role: "user", content: question },
      { role: "assistant", content: answer }
    );
    chatHistory = chatHistory.slice(-12);

  } catch (error) {
    var typing = byId("typing-indicator");
    if (typing) typing.remove();

    showChatError(
      error.message || "Something went wrong. Please try again."
    );

  } finally {
    isSending = false;
    byId("send-button").disabled = false;
    input.focus();
  }
}


  document.querySelectorAll("[data-open-chat]").forEach(function (button) { button.addEventListener("click", openChat); });
  byId("close-chat").addEventListener("click", closeChat);
  byId("chat-backdrop").addEventListener("click", function (event) { if (event.target === byId("chat-backdrop")) closeChat(); });
  byId("chat-form").addEventListener("submit", sendChat);
  byId("menu-toggle").addEventListener("click", function () {
    var nav = byId("nav-links");
    var open = nav.classList.toggle("nav-open");
    byId("menu-toggle").setAttribute("aria-expanded", String(open));
    byId("menu-toggle").textContent = open ? "×" : "☰";
  });
  document.querySelectorAll("#nav-links a").forEach(function (link) {
    link.addEventListener("click", function () {
      byId("nav-links").classList.remove("nav-open");
      byId("menu-toggle").setAttribute("aria-expanded", "false");
      byId("menu-toggle").textContent = "☰";
    });
  });
  document.querySelectorAll("[data-question]").forEach(function (button) {
    button.addEventListener("click", function () {
      byId("chat-input").value = button.getAttribute("data-question");
      byId("chat-input").focus();
    });
  });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape" && !byId("chat-backdrop").hidden) closeChat(); });

  byId("copyright").textContent = "© " + new Date().getFullYear() + " Sangam Chaurasiya";
  loadProfile();
})();
