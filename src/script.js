const getCourses = () => [
  ...document.getElementsByClassName("rishu-koma-inner")
]

const getCourseCode = (course) => {
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

const appendFacilityData = (course, facility) => {
  if (facility != null) {
    const facilityWithColor = '<font color="#DF3A01">' + facility + "</font>"
    course.innerHTML = course.innerHTML + "\n" + facilityWithColor
  }
}

const getTerm = () => {
  const now = new Date()
  if (now.getMonth() < 3) {
    return now.getFullYear() - 1
  } else {
    return now.getFullYear()
  }
}

;(async () => {
  const courses = getCourses()
  const courseCodes = courses
    .map((course) => getCourseCode(course))
    .filter((code) => code)
  const cachedCodes = await new Promise((resolve, reject) => {
    chrome.storage.local.get(courseCodes, (cached) => {
      if (chrome.runtime.lastError) {
        const e = chrome.runtime.lastError.message
        console.error(e)
        reject(e)
      } else {
        resolve(cached)
      }
    })
  })

  const query = courses
    .reduce((prev, curr) => {
      const courseCode = getCourseCode(curr)
      if (!courseCode) {
        return prev
      }
      const cachedFacility = cachedCodes[courseCode]
      if (cachedFacility) {
        appendFacilityData(curr, cachedFacility)
      } else {
        return `${prev} ${courseCode}`
      }
      return prev
    }, "")
    .trim()

  if (!query) {
    return
  }

  const params = {
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
  chrome.runtime.sendMessage({ params }, (data) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(
      eval("(" + data + ")")["list"],
      "text/html"
    )
    const tables = [...doc.getElementsByTagName("table")]
    const facilities = tables.reduce((prev, curr) => {
      const course = curr.getElementsByClassName("ut-course")[0].innerText
      const facility = curr.getElementsByClassName("ut-facility")[0].innerText
      prev[course] = facility
      // キャッシュ
      chrome.storage.local.set({ [course]: facility }, () => {})
      return prev
    }, {})

    courses.forEach((course) => {
      const courseCode = getCourseCode(course)
      if (!courseCode) {
        return
      }

      // キャッシュを使って既に表示していないか
      if (course.innerText.indexOf(facilities[courseCode]) != -1) {
        return
      }

      appendFacilityData(course, facilities[courseCode])
    })
  })
})()
