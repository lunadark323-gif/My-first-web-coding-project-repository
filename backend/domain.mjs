import {catalog,rentalQuote} from './pricing.mjs';
export const cars=catalog.cars;
export const quote=rentalQuote;
export function overlaps(a,b){return a.start<b.end&&a.end>b.start;}
export function escapeHTML(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function customerValid(c){return c&&typeof c.name==='string'&&c.name.trim().length>=5&&c.name.length<=150&&/^\+?[\d ()-]{10,22}$/.test(c.phone||'')&&/^\d{10}$/.test((c.passport||'').replace(/\s/g,''))&&typeof c.issuer==='string'&&c.issuer.length>=5&&c.issuer.length<=500&&/^\d{4}-\d{2}-\d{2}$/.test(c.passport_date||'')&&/^\d{4}-\d{2}-\d{2}$/.test(c.birth_date||'')&&typeof c.address==='string'&&c.address.length>=8&&c.address.length<=500&&/^[\dА-Яа-яA-Za-z ]{8,20}$/.test(c.license||'')&&/^\d{4}-\d{2}-\d{2}$/.test(c.license_date||'')&&/^\d{4}-\d{2}-\d{2}$/.test(c.license_expiry||'');}


