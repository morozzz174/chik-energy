(function () {
  var burger = document.querySelector(".burger");
  var nav = document.querySelector(".nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      burger.classList.toggle("open");
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        burger.classList.remove("open");
        nav.classList.remove("open");
      });
    });
  }

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  }

  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    if (!q || !a) return;
    q.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (other) {
        other.classList.remove("open");
        var oa = other.querySelector(".faq-a");
        if (oa) oa.style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add("open");
        a.style.maxHeight = a.scrollHeight + "px";
      }
    });
  });

  var FORMSPREE = "https://formsubmit.co/chik174@yandex.ru";

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    var success = form.querySelector(".form-success");
    var error = form.querySelector(".form-error");
    var btn = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (error) error.classList.remove("show");

      var name = form.querySelector('[name="name"]');
      var phone = form.querySelector('[name="phone"]');
      if (name && !name.value.trim()) { name.focus(); return; }
      if (phone && phone.value.replace(/\D/g, "").length < 10) { phone.focus(); return; }

      if (btn) { btn.disabled = true; btn.textContent = "Отправляем..."; }

      var data = new FormData(form);

      fetch(FORMSPREE, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      })
        .then(function (r) {
          if (btn) { btn.disabled = false; btn.textContent = "Отправить заявку"; }
          if (r.ok) {
            form.reset();
            if (success) success.classList.add("show");
            setTimeout(function () {
              if (success) success.classList.remove("show");
            }, 8000);
          } else {
            throw new Error("bad response");
          }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = "Отправить заявку"; }
          if (error) error.classList.add("show");
        });
    });
  });
})();
