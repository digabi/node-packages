;(function () {
  document.getElementById('saml-payload').value = document.getElementById('samlResponse').textContent
  document.getElementById('login').submit()
})()
