firebase.initializeApp({
  apiKey: "AIzaSyA9-x5sSHwEIxV1TeU4bSk64WZ6AqftyY0",
  authDomain: "kdb-mirror.firebaseapp.com",
  databaseURL: "https://kdb-mirror.firebaseio.com",
  projectId: "kdb-mirror",
  storageBucket: "kdb-mirror.appspot.com",
  messagingSenderId: "76116343804",
  appId: "1:76116343804:web:c98075e3ec10a079cc1079"
})

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  Promise.all(
    request.courseIds.map(async (id) => {
      const snap = await firebase
        .firestore()
        .collection("courses")
        .doc(id)
        .get()
      return { ...snap.data(), id: snap.id }
    })
  ).then((data) => {
    sendResponse(data)
  })

  return true
})
