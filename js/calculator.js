(function () {
  var calc = document.querySelector("[data-calc]");
  if (!calc) return;

  var APPLIANCES = [
    { id: "boiler", name: "Газовый котёл + насосы", hint: "100–200 Вт, зависит от сезона", watts: 150, on: true, qty: 1 },
    { id: "fridge", name: "Холодильник", hint: "150–300 Вт, усреднённо", watts: 220, on: true, qty: 1 },
    { id: "light", name: "Освещение (LED)", hint: "50–100 Вт по дому", watts: 75, on: true, qty: 1 },
    { id: "router", name: "Роутер + сигнализация", hint: "20–50 Вт, всегда включены", watts: 35, on: true, qty: 1 },
    { id: "pump", name: "Насос водоснабжения", hint: "500–1000 Вт, работает периодически", watts: 750, on: false, qty: 1 }
  ];

  var CAPACITIES = [5.12, 10.24, 15.36];
  var battery = 5.12;
  var DOD = 0.95;
  var EFF = 0.92;

  var list = calc.querySelector("[data-appliances]");
  var batteryBox = calc.querySelector("[data-battery]");
  var outPower = calc.querySelector("[data-out-power]");
  var outHours = calc.querySelector("[data-out-hours]");
  var outDays = calc.querySelector("[data-out-days]");
  var outEnergy = calc.querySelector("[data-out-energy]");
  var outReco = calc.querySelector("[data-out-reco]");

  function fmtNum(n, digits) {
    return n.toFixed(digits).replace(".", ",");
  }

  function fmtTime(hours) {
    if (!isFinite(hours) || hours <= 0) return "—";
    if (hours < 1) return Math.round(hours * 60) + " мин";
    if (hours < 24) {
      var h = Math.floor(hours);
      var m = Math.round((hours - h) * 60);
      return m > 0 ? h + " ч " + m + " мин" : h + " ч";
    }
    var d = Math.floor(hours / 24);
    var rh = Math.round(hours - d * 24);
    return d + " д " + rh + " ч";
  }

  function recommend(totalW) {
    if (totalW === 0) return "Отметьте хотя бы один прибор — покажем подходящий комплект.";
    if (totalW <= 700) {
      return "Вариант «Стандарт»: ИБП 3 кВт + аккумулятор LiFePO4 5,12 кВт·ч. Защита котла, холодильника, света и слаботочки. Под ключ ~200 000 ₽.";
    }
    if (totalW <= 2100) {
      return "Вариант «Стандарт» с запасом: ИБП 3 кВт + 1–2 модуля 5,12 кВт·ч. Нагрузка в пределах 70% от номинала (2,1 кВт) — безопасно для газовых котлов.";
    }
    if (totalW <= 4000) {
      return "Вариант «Премиум»: MUST HBP18-5548 ESS (5,5 кВт, 1 модуль) или PowerPRO 6 кВт. Для полного дома с возможностью солнечных панелей.";
    }
    return "Мощная связка «Премиум»: PowerPRO 6 кВт + 2–3 аккумулятора (10–15 кВт·ч). Рекомендуем выезд инженера для расчёта по Вашему дому.";
  }

  function renderList() {
    list.innerHTML = "";
    APPLIANCES.forEach(function (a) {
      var row = document.createElement("div");
      row.className = "appliance" + (a.on ? " checked" : "");
      row.dataset.id = a.id;

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = a.on;
      checkbox.addEventListener("change", function () {
        a.on = checkbox.checked;
        recalc();
      });

      var chk = document.createElement("span");
      chk.className = "chk";
      chk.textContent = a.on ? "✓" : "";

      var mid = document.createElement("span");
      var nameEl = document.createElement("span");
      nameEl.className = "name";
      nameEl.textContent = a.name;
      var hintEl = document.createElement("span");
      hintEl.className = "hint";
      hintEl.textContent = a.hint;
      mid.appendChild(nameEl);
      mid.appendChild(document.createElement("br"));
      mid.appendChild(hintEl);

      var watts = document.createElement("span");
      watts.className = "watts";
      watts.setAttribute("data-w", "");
      watts.textContent = a.watts + " Вт × " + a.qty;

      var qtyWrap = document.createElement("div");
      qtyWrap.className = "qty-row";
      qtyWrap.style.gridColumn = "1 / -1";

      var minus = document.createElement("button");
      minus.type = "button";
      minus.className = "qty-btn";
      minus.textContent = "−";
      minus.addEventListener("click", function () {
        if (a.qty > 1) {
          a.qty--;
          recalc();
        }
      });

      var val = document.createElement("span");
      val.className = "qty-val";
      val.textContent = a.qty;

      var plus = document.createElement("button");
      plus.type = "button";
      plus.className = "qty-btn";
      plus.textContent = "+";
      plus.addEventListener("click", function () {
        if (a.qty < 5) {
          a.qty++;
          recalc();
        }
      });

      qtyWrap.appendChild(minus);
      qtyWrap.appendChild(val);
      qtyWrap.appendChild(plus);

      row.appendChild(checkbox);
      row.appendChild(chk);
      row.appendChild(mid);
      row.appendChild(watts);
      row.appendChild(qtyWrap);
      list.appendChild(row);
    });
  }

  function renderBattery() {
    batteryBox.innerHTML = "";
    CAPACITIES.forEach(function (cap) {
      var el = document.createElement("div");
      el.className = "battery-opt" + (battery === cap ? " active" : "");
      var b = document.createElement("b");
      b.textContent = fmtNum(cap, 2);
      var s = document.createElement("span");
      s.textContent = "кВт·ч";
      el.appendChild(b);
      el.appendChild(s);
      el.addEventListener("click", function () {
        battery = cap;
        recalc();
      });
      batteryBox.appendChild(el);
    });
  }

  function recalc() {
    renderList();
    renderBattery();

    var totalW = 0;
    APPLIANCES.forEach(function (a) {
      if (a.on) totalW += a.watts * a.qty;
      var row = list.querySelector('[data-id="' + a.id + '"]');
      if (!row) return;
      var w = row.querySelector("[data-w]");
      if (w) {
        w.textContent = a.on
          ? a.watts + " Вт × " + a.qty + " = " + a.watts * a.qty + " Вт"
          : a.watts + " Вт";
        w.style.color = a.on ? "" : "var(--muted)";
      }
    });

    var usable = battery * DOD * EFF;
    var hours = totalW > 0 ? (usable * 1000) / totalW : 0;

    outPower.textContent = totalW > 0 ? totalW + " Вт" : "0 Вт";
    outHours.textContent = totalW > 0 ? fmtTime(hours) : "—";
    if (outDays) outDays.textContent = totalW > 0 ? fmtNum(hours / 24, 1) : "—";
    outEnergy.textContent = fmtNum(usable, 2) + " кВт·ч";
    outReco.textContent = recommend(totalW);
  }

  recalc();
})();
