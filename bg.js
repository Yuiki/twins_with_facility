chrome.runtime.onMessage.addListener(function(request, _sender, sendResponse) {
  const params = new URLSearchParams()
  for (const k in request.params) {
    params.set(k, request.params[k])
  }
  fetch("https://kdb.tsukuba.ac.jp", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  }).then(async (res) => {
    const txt = await res.text()
    sendResponse(txt)
  })
  return true
})
