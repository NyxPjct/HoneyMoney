// Runs in the sandboxed setup screen; talks to the main process only through window.honeymoney.
(function () {
  var form = document.getElementById("form");
  var input = document.getElementById("server");
  var errorBox = document.getElementById("error");
  var button = form.querySelector("button");

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
  }

  var params = new URLSearchParams(window.location.search);
  if (params.get("error")) showError(params.get("error"));

  window.honeymoney.getServer().then(function (current) {
    if (current) input.value = current;
    input.focus();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    button.disabled = true;
    showError("");
    window.honeymoney.setServer(input.value).then(function (result) {
      button.disabled = false;
      if (!result.ok) showError(result.error || "Endereço inválido.");
    });
  });
})();
