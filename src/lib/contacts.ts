export type DemoContact = {
  id: string;
  name: string;
  phone: string;
  displayPhone: string;
  role: string;
};

/** Hardcoded local dealerships — #3 is your live demo line. */
export const DEMO_CONTACTS: DemoContact[] = [
  {
    id: "contact-1",
    name: "Capitol Honda",
    phone: "+14165550101",
    displayPhone: "(416) 555-0101",
    role: "Oshawa · new & used"
  },
  {
    id: "contact-2",
    name: "Metro Toyota",
    phone: "+14165550202",
    displayPhone: "(416) 555-0202",
    role: "Pickering · sales desk"
  },
  {
    id: "contact-3",
    name: "Durham Honda",
    phone: "+16472616387",
    displayPhone: "647-261-6387",
    role: "Civic Type R · your number"
  }
];

export function getContactById(id: string): DemoContact | undefined {
  return DEMO_CONTACTS.find((contact) => contact.id === id);
}

export function getContactByIndex(index: number): DemoContact | undefined {
  return DEMO_CONTACTS[index];
}
