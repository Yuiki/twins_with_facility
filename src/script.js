const getCourses = () => [
  ...document.getElementsByClassName("rishu-koma-inner")
]

const getCourseCode = (course) => {
  let code
  const aTag = course.getElementsByTagName("a")[0]
  if (aTag) {
    code = aTag.innerText.trim()
  }

  // 科目番号がaタグで囲まれていない場合
  code = course.innerText.split("\n")[0].trim()
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
  const cachedFacilities = await new Promise((resolve, reject) => {
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

  const courseIds = courses
    .map((course) => {
      const code = getCourseCode(course)
      if (!code) {
        return
      }
      const cachedFacility = cachedFacilities[code]
      if (cachedFacility) {
        appendFacilityData(course, cachedFacility)
        return
      }
      return code
    })
    .filter((code) => code)

  if (courseIds.length === 0) {
    return
  }

  chrome.runtime.sendMessage({ courseIds }, (snaps) => {
    const facilities = snaps.reduce((prev, curr) => {
      const course = curr.id
      const facility = curr.classRoom
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

      const facility = facilities[courseCode]
      // キャッシュを使って既に表示していないか
      if (course.innerText.indexOf(facility) != -1) {
        return
      }

      appendFacilityData(course, facility)
    })
  })
})()
