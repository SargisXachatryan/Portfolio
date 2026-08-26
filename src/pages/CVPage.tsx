import '../styles/CVPage.css'

const CV_URL = 'https://sargisXachatryan.github.io/Portfolio/resources/Sargis_Khachatryan_CV.pdf'

export default function CVPage() {
  return (
    <main className="cv-page">
      <div className="cv-content">

        <div className="cv-viewer-wrap">
          <iframe
            src={`${CV_URL}#view=FitH`}
            title="Sargis Khachatryan — CV"
            className="cv-viewer"
          />
        </div>

        <a
          href={CV_URL}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="cv-download"
        >
          Download PDF <span className="cv-download-arrow">↓</span>
        </a>

        {/* Fallback for browsers (mostly mobile) that won't render a PDF inside an iframe */}
        <p className="cv-fallback-note">
          Viewer not loading? <a href={CV_URL} target="_blank" rel="noopener noreferrer">Open the PDF directly</a>.
        </p>
      </div>
    </main>
  )
}