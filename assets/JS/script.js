const calendar = document.getElementById("calendar");
  const eventList = document.getElementById("eventList");
  const gif = document.getElementById("gif");
  let events = JSON.parse(localStorage.getItem("calendarEvents")) || {};

  let current = new Date();

  function renderCalendar() {
    const year = current.getFullYear();
    const month = current.getMonth();
    const today = new Date();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    document.getElementById("calendar").innerHTML = "";
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    daysOfWeek.forEach(day => {
      const el = document.createElement("div");
      el.innerText = day;
      el.style.fontWeight = "bold";
      calendar.appendChild(el);
    });

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      calendar.appendChild(empty);
    }

    for (let i = 1; i <= totalDays; i++) {
      const el = document.createElement("div");
      el.className = "day";
      el.innerText = i;
      const fullDate = `${year}-${month + 1}-${i}`;
      if (
        i === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
      ) {
        el.classList.add("today");
      }
      el.onclick = () => {
        const eventName = prompt("Add event for " + fullDate);
        if (eventName) {
          if (!events[fullDate]) events[fullDate] = [];
          events[fullDate].push(eventName);
          updateEventList();
          localStorage.setItem("calendarEvents", JSON.stringify(events));
          speak("Event added on " + fullDate);
        }
      };
      calendar.appendChild(el);
    }
  }

  function prevMonth() {
    current.setMonth(current.getMonth() - 1);
    renderCalendar();
    updateEventList();
  }

  function nextMonth() {
    current.setMonth(current.getMonth() + 1);
    renderCalendar();
    updateEventList();
  }

  function updateEventList() {
    eventList.innerHTML = "";
    Object.keys(events).forEach(date => {
      events[date].forEach(e => {
        const li = document.createElement("li");
        li.innerText = `${date}: ${e}`;
        eventList.appendChild(li);
      });
    });
  }

  function speak(text) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    const voice = window.speechSynthesis.getVoices().find(v => v.name.includes("Female") || v.name.includes("Google"));
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  }

  function toggleTheme() {
    document.body.classList.toggle("dark");
    const mode = document.body.classList.contains("dark") ? "Dark mode" : "Light mode";
    speak(mode + " activated");
  }

  function exportEvents() {
    speak("Exporting events to PDF");
    const element = document.createElement("div");
    element.innerHTML = `<h1>Event List</h1><ul>${Object.entries(events).map(([date, list]) => `<li>${date}: ${list.join(', ')}</li>`).join('')}</ul>`;
    html2pdf().from(element).save("Calendar_Events.pdf");
  }

  function startListening() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    gif.style.display = "block";
    recognition.start();

    recognition.onresult = function(event) {
      gif.style.display = "none";
      const command = event.results[0][0].transcript.toLowerCase();
      speak("You said: " + command);
      processCommand(command);
    };

    recognition.onerror = () => {
      gif.style.display = "none";
      speak("Sorry, I didn't hear that clearly.");
    };
  }

  function processCommand(cmd) {
    const year = current.getFullYear();
    if (cmd.includes("add event on")) {
      const match = cmd.match(/add event on (\d{1,2}) (\w+)/);
      if (match) {
        const day = parseInt(match[1]);
        const monthStr = match[2];
        const monthNames = ["january","february","march","april","may","june","july","august","september","october","november","december"];
        const mIndex = monthNames.indexOf(monthStr);
        if (mIndex >= 0) {
          const fullDate = `${year}-${mIndex+1}-${day}`;
          const title = prompt("Event title?");
          if (title) {
            if (!events[fullDate]) events[fullDate] = [];
            events[fullDate].push(title);
            updateEventList();
            localStorage.setItem("calendarEvents", JSON.stringify(events));
            speak("Event added on " + fullDate);
          }
        }
      }
    } else if (cmd.includes("today's events") || cmd.includes("show today")) {
      const today = new Date();
      const fullDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      const list = events[fullDate];
      if (list && list.length > 0) {
        speak("Today you have: " + list.join(", "));
      } else {
        speak("You have no events today.");
      }
    } else if (cmd.includes("toggle theme") || cmd.includes("dark mode")) {
      toggleTheme();
    } else if (cmd.includes("export events")) {
      exportEvents();
    } else {
      speak("Sorry, I did not understand that.");
    }
  }

  function checkReminders() {
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    if (events[key]) {
      speak("Reminder: You have " + events[key].join(", "));
    }
  }

  renderCalendar();
  updateEventList();
  checkReminders();