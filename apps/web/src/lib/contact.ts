const whatsappNumber = "27670127776";

export const contact = {
  phoneDisplay: "+27 67 012 7776",
  phoneHref: "tel:+27670127776",
  email: "tours.st@outlook.com",
  serviceArea: "Cape Town & Western Cape",
  whatsapp: `https://wa.me/${whatsappNumber}`,
  facebook: "https://www.facebook.com/sl.tours.ct",
  instagram: "https://www.instagram.com/sl_tours/",
  tiktok: "https://www.tiktok.com/@sl_tours",
  googleReview: "https://g.page/r/CRyeNopih97yEAE/review",
  tripadvisorReview:
    "https://www.tripadvisor.com/UserReviewEdit-g312659-d33018429-SL_Tours-Cape_Town_Central_Western_Cape.html"
};

export function whatsappReserveUrl(tourName: string) {
  const message = `Hello SL Tours, I would like to reserve ${tourName}. Please share the next available date, what is included, and pickup details.`;
  return `${contact.whatsapp}?text=${encodeURIComponent(message)}`;
}
