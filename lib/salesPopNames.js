// Display names + cities for the public "recent purchase" trust popup (components/TrustPop.jsx).
// These are illustrative, not tied to real customer records - real names/emails are never shown to
// other visitors. A mix of Bangladeshi and international identities matches the site's real customer
// base (local buyers + overseas Bangladeshi / international group-buy customers).
export const SALES_POP_PEOPLE = [
  { name: "Rakibul Islam", city: "Dhaka" },
  { name: "Tanvir Ahmed", city: "Chattogram" },
  { name: "Nusrat Jahan", city: "Sylhet" },
  { name: "Mehedi Hasan", city: "Khulna" },
  { name: "Sadia Islam", city: "Rajshahi" },
  { name: "Farhan Rahman", city: "Dhaka" },
  { name: "Sumaiya Akter", city: "Cumilla" },
  { name: "Imran Kabir", city: "Barishal" },
  { name: "Jannatul Ferdous", city: "Rangpur" },
  { name: "Shakil Ahmed", city: "Mymensingh" },
  { name: "Rezaul Karim", city: "Narayanganj" },
  { name: "Fahmida Sultana", city: "Gazipur" },
  { name: "Arif Hossain", city: "Dhaka" },
  { name: "Nazia Rahman", city: "Chattogram" },
  { name: "Tanjil Ahmed", city: "Sylhet" },
  { name: "Mahmudul Hasan", city: "Bogura" },
  { name: "Rumana Akter", city: "Khulna" },
  { name: "Shariar Nafis", city: "Dhaka" },
  { name: "Afsana Mimi", city: "Jessore" },
  { name: "Ashraful Islam", city: "Rajshahi" },
  { name: "Kamrul Hasan", city: "Dhaka" },
  { name: "Sabrina Yasmin", city: "Cumilla" },
  { name: "Shamim Reza", city: "Narsingdi" },
  { name: "Tahmina Akter", city: "Feni" },
  { name: "Zahidul Islam", city: "Dhaka" },
  { name: "James Carter", city: "New York, USA" },
  { name: "Emily Johnson", city: "London, UK" },
  { name: "Carlos Silva", city: "São Paulo, Brazil" },
  { name: "Fatima Al-Sayed", city: "Dubai, UAE" },
  { name: "Hiroshi Tanaka", city: "Tokyo, Japan" },
  { name: "Sophie Müller", city: "Berlin, Germany" },
  { name: "Liam O'Connor", city: "Dublin, Ireland" },
  { name: "Aisha Khan", city: "Karachi, Pakistan" },
  { name: "David Kim", city: "Seoul, South Korea" },
  { name: "Olivia Brown", city: "Sydney, Australia" },
  { name: "Ahmed Al-Farsi", city: "Riyadh, Saudi Arabia" },
  { name: "Maria Garcia", city: "Madrid, Spain" },
  { name: "Noah Williams", city: "Toronto, Canada" },
  { name: "Chloe Martin", city: "Paris, France" },
  { name: "Priya Sharma", city: "Mumbai, India" },
  { name: "Mohammed Al-Rashid", city: "Doha, Qatar" },
  { name: "Isabella Rossi", city: "Milan, Italy" },
  { name: "Daniel Wilson", city: "Manchester, UK" },
  { name: "Ryan Tan", city: "Singapore" },
];

export const SALES_POP_TIME_LABELS = ["just now", "1 minute ago", "2 minutes ago", "3 minutes ago", "4 minutes ago", "6 minutes ago"];

export function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
