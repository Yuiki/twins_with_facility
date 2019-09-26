;(function() {
  var query = ""
  getCourses().each(function() {
    var course = $(this)
    var courseCode = getCourseCode(course)
    if (courseCode == null) {
      return
    }
    if (isTakesCourse(courseCode)) {
      query += courseCode + " "

      // キャッシュがあればそれを表示
      chrome.storage.local.get(courseCode, function(cache) {
        appendFacilityData(course, cache[courseCode])
      })
    }
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
    dom = $.parseHTML(eval("(" + data + ")")["list"])
    $.each(dom, function(i, el) {
      if (el.nodeName != "TABLE") {
        return
      }
      var innerHTML = el.innerHTML
      var course = innerHTML.match(/course">(.*)(?=<\/p>)/)[1]
      var facility = innerHTML.match(/facility">(.*)(?=<\/p>)/)[1]

      facilities[course] = facility
      // キャッシュ
      chrome.storage.local.set({ [course]: facility }, function() {})
    })

    getCourses().each(function() {
      var course = $(this)
      var courseCode = getCourseCode(course)
      if (courseCode == null) {
        return
      }

      // キャッシュを使って既に表示していないか
      if (course.html().indexOf(facilities[courseCode]) != -1) {
        return
      }

      if (isTakesCourse(courseCode)) {
        appendFacilityData(course, facilities[courseCode])
      }
    })
  })

  function getCourses() {
    return $(".rishu-koma-inner td")
  }

  function getCourseCode(course) {
    var courseCode = course.children("a").html()

    if (courseCode == null) {
      var matched = course
        .html()
        .trim()
        .match(/.*(?=<br)/)
      // 科目番号がaタグで囲まれていない場合
      if (matched != null) {
        return matched[0]
      } else {
        return null
      }
    }

    return courseCode.trim()
  }

  function isTakesCourse(courseCode) {
    return courseCode != "未登録" && courseCode != "None"
  }

  function appendFacilityData(course, facility) {
    if (facility != null) {
      var facility_with_color = '<font color="#DF3A01">' + facility + "</font>"
      course.html(course.html() + "\n" + facility_with_color)
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
