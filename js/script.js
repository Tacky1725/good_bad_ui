document.addEventListener("DOMContentLoaded", () => {
  const form      = document.getElementById("good-form");
  const submitBtn = document.querySelector(".btn-submit");
  const toggleBtn = document.getElementById("toggle-ui");

  // 各フィールドのタッチ状態を記録
  const touched = {};

  // ----- 全角→半角変換ユーティリティ -----
  function toHalfWidth(str) {
    return str
      .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
      .replace(/[－ー—―]/g, "-");
  }

  // --- フィールド定義（必須項目だけ列挙）---
  const fields = [
    { id: "surname",        msg: "姓を入力してください" },
    { id: "givenname",      msg: "名を入力してください" },
    { id: "surname_kana",   msg: "姓（ふりがな）を入力してください" },
    { id: "givenname_kana", msg: "名（ふりがな）を入力してください" },
    { id: "birthyear",      msg: "年を選択してください" },
    { id: "birthmonth",     msg: "月を選択してください" },
    { id: "birthday",       msg: "日を選択してください" },
    { id: "postal",         msg: "郵便番号を7桁で入力してください" },
    { id: "prefecture",     msg: "都道府県を選択してください" },
    { id: "city",           msg: "市区町村以下を入力してください" },
    { id: "email",          msg: "有効なメールアドレスを入力してください" },
  ];
  // 初期化
  fields.forEach(f => touched[f.id] = false);

  // --- バリデート + エラーメッセージ表示（touched チェック付き） ---
  function validateField(id, message) {
    const el = document.getElementById(id);
    let err;
    // 生年月日は共通エリア
    if (["birthyear","birthmonth","birthday"].includes(id)) {
      err = document.getElementById("birthdate-error");
    } else {
      err = el.closest(".field-input").querySelector(".error-message");
    }
    // touched されていなければ、エラーを消すだけ
    if (!touched[id]) {
      err.textContent = "";
      return el.checkValidity();
    }
    // 触ったあとは通常検証
    if (!el.checkValidity()) {
      err.textContent = message;
      return false;
    }
    err.textContent = "";
    return true;
  }

  // --- 生年月日ドロップダウン生成 ---
  const now         = new Date().getFullYear();
  const yearSelect  = document.getElementById("birthyear");
  const monthSelect = document.getElementById("birthmonth");
  const daySelect   = document.getElementById("birthday");
  yearSelect.innerHTML  = "<option value=''>----</option>";
  monthSelect.innerHTML = "<option value=''>--</option>";
  daySelect.innerHTML   = "<option value=''>--</option>";
  for (let y = now; y >= now - 100; y--) {
    const o = document.createElement("option");
    o.value = y; o.textContent = y;
    yearSelect.appendChild(o);
  }
  for (let m = 1; m <= 12; m++) {
    const o = document.createElement("option");
    o.value = m; o.textContent = m;
    monthSelect.appendChild(o);
  }
  function updateDays() {
    const y = +yearSelect.value, m = +monthSelect.value;
    if (!y || !m) {
      daySelect.innerHTML = "<option value=''>--</option>";
      return;
    }
    const days = new Date(y, m, 0).getDate();
    daySelect.innerHTML = "<option value=''>--</option>";
    for (let d = 1; d <= days; d++) {
      const o = document.createElement("option");
      o.value = d; o.textContent = d;
      daySelect.appendChild(o);
    }
  }
  yearSelect.addEventListener("change", updateDays);
  monthSelect.addEventListener("change", updateDays);
  updateDays();

  // --- 郵便番号＆住所検索 ---
  const postalInput = document.getElementById("postal");
  postalInput.addEventListener("input", () => {
    let v = postalInput.value.replace(/\D/g, "").slice(0,7);
    postalInput.value = v.length===7 ? v.replace(/(\d{3})(\d+)/,"$1-$2") : v;
  });
  postalInput.addEventListener("blur", () => {
    touched["postal"] = true;
    postalInput.value = toHalfWidth(postalInput.value);
    validateField("postal", "郵便番号を7桁で入力してください");
    updateSubmitState();
  });
  document.getElementById("search-address").addEventListener("click", async () => {
    const zip = postalInput.value.replace(/-/g,"");
    if (!/^\d{7}$/.test(zip)) return;
    try {
      const res  = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
      const data = await res.json();
      if (data.status===200 && data.results) {
        const r = data.results[0];
        document.getElementById("prefecture").value = r.address1;
        document.getElementById("city").value       = r.address2 + r.address3;
      }
    } catch {}
  });

  const cityInput     = document.getElementById("city");
  const buildingInput = document.getElementById("building");
  cityInput.addEventListener("blur", () => {
    touched["city"] = true;
    cityInput.value = toHalfWidth(cityInput.value);
    validateField("city", "市区町村以下を入力してください");
    updateSubmitState();
  });
  buildingInput.addEventListener("blur", () => {
    buildingInput.value = toHalfWidth(buildingInput.value);
  });

  // --- 電話番号自動ハイフン ---
  const phoneInput = document.getElementById("phone");
  phoneInput.addEventListener("input", () => {
    let v = phoneInput.value.replace(/\D/g,"").slice(0,11);
    v = v.length>7 ? v.replace(/(\d{3})(\d{4})(\d+)/,"$1-$2-$3")
                  : v.length>3 ? v.replace(/(\d{3})(\d+)/,"$1-$2")
                               : v;
    phoneInput.value = v;
  });

  // --- 送信ボタン状態更新 & プログレス更新 ---
  function updateSubmitState() {
    const allValid = fields.every(({id}) => {
      const el = document.getElementById(id);
      if (!el.required) return true;
      return validateField(id, fields.find(f=>f.id===id).msg);
    });
    submitBtn.disabled = !allValid;
    updateProgress();
  }

  function updateProgress() {
    const reqFs = fields.filter(({id}) => document.getElementById(id).required);
    const total = reqFs.length;
    const done  = reqFs.reduce((c,{id}) => {
      const el = document.getElementById(id);
      return (el.value.trim()!=="" && el.checkValidity()) ? c+1 : c;
    },0);
    const pct = Math.round(done/total*100);
    document.getElementById("progress-bar").style.width = pct + "%";
    document.getElementById("progress-text").innerHTML =
      `<span class="progress-count">${done}/${total}</span> 項目の入力が完了しました`;
  }

  // --- フォーム全体イベント ---
  form.addEventListener("input",   () => updateSubmitState());
  form.addEventListener("change",  () => updateSubmitState());
  form.addEventListener("blur",    e => {
    if (touched.hasOwnProperty(e.target.id)) {
      touched[e.target.id] = true;
      updateSubmitState();
    }
  }, true);

  // 初期化
  updateSubmitState();

  // --- 送信 & UI切替 ---
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    alert("送信完了！");
    form.reset();
    fields.forEach(f => touched[f.id] = false);
    document.querySelectorAll(".error-message").forEach(el=>el.textContent="");
    updateSubmitState();
  });
  toggleBtn.addEventListener("click", () => window.location.href = "bad-ui.html");
});
