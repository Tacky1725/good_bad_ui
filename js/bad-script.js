// bad-script.js
document.addEventListener("DOMContentLoaded", () => {
  const form      = document.getElementById("bad-form");
  const toggleBtn = document.getElementById("toggle-ui");

  // 「良いUI」に戻すボタン
  toggleBtn.addEventListener("click", () => {
    window.location.href = "good-ui.html";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // 前回のエラーをクリア
    document.querySelectorAll(".error-message").forEach(el => el.textContent = "");

    let hasError = false;
    // 必須チェック：空欄のものはすべてエラー表示
    const requiredFields = [
      { id: "name",         label: "名前" },
      { id: "birthyear",    label: "年" },
      { id: "birthmonth",   label: "月" },
      { id: "birthday",     label: "日" },
      { id: "postal1",      label: "郵便番号" },
      { id: "postal2",      label: "郵便番号" },
      { id: "prefecture",   label: "都道府県" },
      { id: "city",         label: "市区町村" },
      { id: "town",         label: "町名" },
      { id: "block",        label: "丁目・番地・号" },
      { id: "email-local",  label: "メールアドレス" },
      { id: "email-domain", label: "メールアドレス" },
    ];
    requiredFields.forEach(f => {
      const el = document.getElementById(f.id);
      if (!el.value.trim()) {
        const err = el.closest(".field-row").querySelector(".error-message");
        err.textContent = `${f.label}はエラーです`;
        hasError = true;
      }
    });

    // 住所フィールド：全角文字のみ許可（半角が含まれるとエラー）
    ["prefecture","city","town","block","building"].forEach(id => {
      const el = document.getElementById(id);
      if (el.value.trim() && /[ -~]/.test(el.value)) {
        const err = el.closest(".field-row").querySelector(".error-message");
        err.textContent = `住所はエラーです`;
        hasError = true;
      }
    });

    if (!hasError) {
      alert("送信完了！");
      form.reset();
    }

    form.reset();
  });
});
