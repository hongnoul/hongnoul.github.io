// Resume template — source of truth for /resume/.
// Content lives in resume.data.json; this file controls only layout/typography.
// Build with: bun scripts/build-resume.mjs

#let data = json("resume.data.json")

#set document(title: data.name + " — Resume", author: data.name)
#set page(paper: "us-letter", margin: (x: 0.65in, y: 0.5in))
#set text(
  font: ("Libertinus Serif", "New Computer Modern", "FreeSerif"),
  size: 10pt,
  fill: rgb("#000"),
)
#set par(leading: 0.5em, justify: false)
#set list(marker: [•], indent: 0pt, body-indent: 6pt)

// — Header —————————————————————————————————————————

#let contact-item(c) = if "href" in c { link(c.href, c.text) } else { c.text }
#let contact = data.contact.map(contact-item).join([~|~])

#align(center)[
  #text(size: 30pt, weight: 800, tracking: -0.6pt)[#data.name]
  #v(9pt, weak: true)
  #text(size: 9pt, fill: rgb("#222"))[#contact]
]

#v(14pt, weak: false)

// — Section / entry primitives ————————————————————

#let section(title, body) = block(below: 11pt, breakable: false)[
  #text(size: 10pt, weight: 700, tracking: 0.6pt)[#upper(title)]
  #v(3pt, weak: true)
  #line(length: 100%, stroke: 1.5pt)
  #v(6pt, weak: true)
  #body
]

#let row(left-body, right-body) = grid(
  columns: (1fr, auto),
  align: (left + bottom, right + bottom),
  column-gutter: 12pt,
  left-body, right-body,
)

#let entry(e) = block(below: 8pt, breakable: false)[
  #row(
    text(size: 11pt, weight: 700)[#e.org],
    if "loc" in e { text(size: 10pt)[#e.loc] },
  )
  #if "role" in e or "date" in e [
    #v(1pt, weak: true)
    #row(
      if "role" in e { emph(text(size: 10pt)[#eval(e.role, mode: "markup")]) },
      if "date" in e { emph(text(size: 10pt)[#eval(e.date, mode: "markup")]) },
    )
  ]
  #if "bullets" in e and e.bullets.len() > 0 [
    #v(3pt, weak: true)
    #set list(spacing: 2.5pt)
    #pad(left: 14pt)[
      #for b in e.bullets [
        - #eval(b, mode: "markup")
      ]
    ]
  ]
]

// — Render ————————————————————————————————————————

#for sec in data.sections {
  section(sec.title)[
    #if "entries" in sec [
      #for e in sec.entries [#entry(e)]
    ] else if "list" in sec [
      #pad(left: 14pt)[
        #for item in sec.list [- #item]
      ]
    ]
  ]
}
