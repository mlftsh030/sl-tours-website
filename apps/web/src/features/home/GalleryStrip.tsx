import { Link } from "react-router-dom";
import { galleryPhotos, thumbSrc } from "../gallery/photos";
import { SectionHeading } from "./SectionHeading";

const featuredIds = [30, 5, 43, 16, 44, 34];
const featured = featuredIds.flatMap((id) => galleryPhotos.filter((photo) => photo.id === id));

export function GalleryStrip() {
  return (
    <section className="gallery-strip" aria-labelledby="gallery-strip-title">
      <SectionHeading id="gallery-strip-title" eyebrow="Gallery" title="Pictures taken on tour" link="/gallery" linkLabel="View the gallery" />
      <ul className="gallery-strip-grid">
        {featured.map((photo) => (
          <li key={photo.id}>
            <Link to="/gallery" aria-label={`View gallery: ${photo.alt}`}>
              <img
                src={thumbSrc(photo)}
                alt=""
                width={photo.width}
                height={photo.height}
                loading="lazy"
                decoding="async"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
