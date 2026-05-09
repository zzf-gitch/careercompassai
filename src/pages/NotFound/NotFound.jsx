import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <section className="notfound-page">
      <div>
        <h1>404</h1>
        <p>Page not found</p>
        <Link to="/" className="notfound-back-home">
          Back to Home
        </Link>
      </div>
    </section>
  )
}

export default NotFound
