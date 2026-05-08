import { Link } from 'react-router-dom'
import './NotFound.css'

function NotFound() {
  return (
    <section id="center">
      <div>
        <h1>404</h1>
        <p>Page not found</p>
        <Link to="/" className="back-home">
          Back to Home
        </Link>
      </div>
    </section>
  )
}

export default NotFound
