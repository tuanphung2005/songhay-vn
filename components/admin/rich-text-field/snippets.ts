export const COMPLETION_ITEMS: Array<{ label: string; insertText: string; documentation: string }> = [
  {
    label: "article-shell",
    insertText:
      "<article>\n  <header>\n    <h1>${1:Tieu de bai viet}</h1>\n    <p>${2:Mo ta ngan}</p>\n  </header>\n\n  <section>\n    <h2>${3:Tieu de muc}</h2>\n    <p>${4:Noi dung}</p>\n  </section>\n</article>",
    documentation: "Khung bai viet co header va section.",
  },
  {
    label: "table-basic",
    insertText:
      "<table>\n  <thead>\n    <tr><th>${1:Cot 1}</th><th>${2:Cot 2}</th></tr>\n  </thead>\n  <tbody>\n    <tr><td>${3:Du lieu 1}</td><td>${4:Du lieu 2}</td></tr>\n  </tbody>\n</table>",
    documentation: "Bang HTML co thead va tbody.",
  },
  {
    label: "image-figure",
    insertText:
      "<figure class=\"image-wrapper\">\n  <img src=\"${1:https://}\" alt=\"${2:Mo ta anh}\" loading=\"lazy\" />\n  <figcaption>${3:Chu thich anh}</figcaption>\n</figure>\n<p>&nbsp;</p>",
    documentation: "Anh kem chu thich figure/figcaption.",
  },
  {
    label: "youtube-embed",
    insertText:
      "<div class=\"video-wrap\">\n  <iframe src=\"${1:https://www.youtube.com/embed/...}\" title=\"${2:Video}\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe>\n</div>",
    documentation: "Khung nhung YouTube co thuoc tinh an toan.",
  },
]
