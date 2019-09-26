chrome.runtime.onMessage.addListener(function(request, _sender, sendResponse) {
  $.post('https://kdb.tsukuba.ac.jp', request.params, function(data, status) {
    if (status != "success") {
      return;
    }
    sendResponse(data);
  })
  return true;
});
