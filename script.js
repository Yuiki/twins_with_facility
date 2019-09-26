;(function() {
  var query = ""
  getCourses().map(function(course) {
    var courseCode = getCourseCode(course)
    if (courseCode == null) {
      return
    }
    query += courseCode + " "

    // キャッシュがあればそれを表示
    chrome.storage.local.get(courseCode, function(cache) {
      appendFacilityData(course, cache[courseCode])
    })
  })

  if (query == "") {
    return
  }

  var params = {
    pageId: "SB0070",
    action: "search",
    txtFy: getTerm(),
    cmbTerm: "",
    cmbDay: "",
    cmbPeriod: "",
    hdnOrg: "",
    hdnReq: "",
    hdnFac: "",
    hdnDepth: "",
    chkSyllabi: false,
    chkAuditor: false,
    txtSyllabus: query,
    reschedule: true,
    page: 0,
    total: -1
  }
  var facilities = {}
  chrome.runtime.sendMessage({ params }, (data) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(
      eval("(" + data + ")")["list"],
      "text/html"
    )
    const tables = [...doc.getElementsByTagName("table")]
    tables.map((table) => {
      const course = table.getElementsByClassName("ut-course")[0].innerText
      const facility = table.getElementsByClassName("ut-facility")[0].innerText
      facilities[course] = facility
      // キャッシュ
      chrome.storage.local.set({ [course]: facility }, function() {})
    })

    getCourses().map(function(course) {
      var courseCode = getCourseCode(course)
      if (courseCode == null) {
        return
      }

      // キャッシュを使って既に表示していないか
      if (course.innerText.indexOf(facilities[courseCode]) != -1) {
        return
      }

      appendFacilityData(course, facilities[courseCode])
    })
  })

  function getCourses() {
    return [...document.getElementsByClassName("rishu-koma-inner")]
  }

  function getCourseCode(course) {
    const aTag = course.getElementsByTagName("a")[0]
    if (aTag) {
      return aTag.innerText.trim()
    }

    // 科目番号がaタグで囲まれていない場合
    const code = course.innerText.split("\n")[0].trim()
    if (code === "未登録") {
      return null
    }
    return code
  }

  function appendFacilityData(course, facility) {
    if (facility != null) {
      var facility_with_color = '<font color="#DF3A01">' + facility + "</font>"
      course.innerHTML = course.innerHTML + "\n" + facility_with_color
    }
  }

  function getTerm() {
    now = new Date()
    if (now.getMonth() < 3) {
      return now.getFullYear() - 1
    } else {
      return now.getFullYear()
    }
  }
})()
