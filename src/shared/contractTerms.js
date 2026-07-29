/**
 * Shared source of truth for the rental agreement's legal text, used both
 * by the customer-facing signing page (verhuur/contract.js) and the admin
 * PDF export (src/shared/contractPdf.js). A copy of this array (plus the version
 * string) is snapshotted into reservations.contract_snapshot at signing
 * time, so a later wording change here never rewrites what a customer
 * already agreed to and signed.
 */

export const CONTRACT_TERMS_VERSION = "2026-07-30-r2";

export const CONTRACT_ARTICLES = [
	{
		title: "Voorwerp",
		paragraphs: [
			"Deze overeenkomst regelt het tijdelijk ter beschikking stellen van materiaal, eigendom van KLJ Wolfsdonk (hierna \"de verhuurder\"), aan de huurder vermeld in deze overeenkomst, voor gebruik tijdens de hieronder vermelde periode.",
			"De volledige lijst van het gehuurde materiaal, de aantallen en de overeengekomen prijzen zijn opgenomen in de materiaallijst bij deze overeenkomst."
		]
	},
	{
		title: "Duur, levering en teruggave",
		paragraphs: [
			"De huurperiode vangt aan op de startdatum en eindigt op de einddatum vermeld in deze overeenkomst.",
			"Het materiaal wordt door de huurder afgehaald en teruggebracht op een tussen partijen overeengekomen tijdstip en locatie, tenzij schriftelijk anders overeengekomen.",
			"Bij laattijdige teruggave is de huurder van rechtswege en zonder ingebrekestelling een bijkomende vergoeding verschuldigd, gelijk aan de dagprijs van het betrokken materiaal per bijkomende dag."
		]
	},
	{
		title: "Huurprijs en waarborg",
		paragraphs: [
			"De huurder betaalt de huurprijs en de waarborg zoals vermeld in deze overeenkomst, via overschrijving op de bankrekening van de verhuurder, met de meegedeelde gestructureerde mededeling, voor de afhaling van het materiaal, tenzij anders overeengekomen.",
			"De waarborg wordt terugbetaald na teruggave van het materiaal, onder aftrek van eventuele kosten voor schade, verlies of laattijdige teruggave zoals bepaald in artikel 5.",
			"Bij gebrek aan tijdige betaling behoudt de verhuurder zich het recht voor de levering van het materiaal op te schorten of de overeenkomst te ontbinden."
		]
	},
	{
		title: "Staat van het materiaal",
		paragraphs: [
			"Het materiaal wordt geacht in goede staat en volledig te zijn afgeleverd, tenzij de huurder bij afhaling schriftelijk of per e-mail melding maakt van zichtbare gebreken.",
			"Bij teruggave wordt de staat van het materiaal in samenspraak tussen partijen vastgesteld. Bij afwezigheid van de verhuurder op het moment van teruggave gebeurt de vaststelling door de verhuurder binnen een redelijke termijn, waarvan de huurder in kennis wordt gesteld.",
			"De huurder heeft het recht deze vaststelling te betwisten, in het bijzonder wanneer zij pas na de teruggave van het materiaal gebeurt, door dit binnen de 5 kalenderdagen na kennisgeving schriftelijk of per e-mail te melden aan de verhuurder."
		]
	},
	{
		title: "Aansprakelijkheid van de huurder",
		paragraphs: [
			"De huurder is, vanaf de afhaling tot de teruggave, aansprakelijk voor beschadiging, vervuiling, waardevermindering of verlies van het gehuurde materiaal, behoudens overmacht in de zin van artikel 8.",
			"De kostprijs van herstelling, reiniging of vervanging wordt in eerste instantie verrekend met de betaalde waarborg. Indien deze kostprijs de waarborg overschrijdt, blijft de huurder het verschil verschuldigd aan de verhuurder.",
			"De huurder staat in voor een normaal en zorgvuldig gebruik van het materiaal, in overeenstemming met het doel waarvoor het bestemd is."
		]
	},
	{
		title: "Aansprakelijkheid van de verhuurder",
		paragraphs: [
			"De verhuurder staat in voor de goede staat van het materiaal bij aanvang van de huurperiode, zoals vastgesteld overeenkomstig artikel 4.",
			"Behoudens in geval van bedrog, opzettelijke fout of grove nalatigheid in hoofde van de verhuurder, is de aansprakelijkheid van de verhuurder voor schade die voortvloeit uit het gebruik van het gehuurde materiaal beperkt tot het bedrag van de betaalde huurprijs voor de betrokken reservatie.",
			"De verhuurder is niet aansprakelijk voor onrechtstreekse schade of gevolgschade van welke aard ook."
		]
	},
	{
		title: "Verbod op onderverhuring",
		paragraphs: [
			"Het is de huurder verboden het gehuurde materiaal geheel of gedeeltelijk onder te verhuren, uit te lenen of anderszins ter beschikking te stellen van derden, zonder voorafgaand schriftelijk akkoord van de verhuurder."
		]
	},
	{
		title: "Overmacht",
		paragraphs: [
			"Geen van beide partijen kan aansprakelijk worden gesteld voor een tekortkoming die het gevolg is van overmacht, zijnde een omstandigheid buiten de wil en controle van de betrokken partij, die deze partij redelijkerwijze niet kon voorzien en waarvan de gevolgen niet konden worden vermeden ondanks alle redelijke inspanningen."
		]
	},
	{
		title: "Ontbinding",
		paragraphs: [
			"Elke partij kan deze overeenkomst met onmiddellijke ingang ontbinden bij een ernstige tekortkoming van de andere partij aan haar verplichtingen, wanneer deze tekortkoming niet binnen een redelijke termijn na schriftelijke ingebrekestelling wordt verholpen."
		]
	},
	{
		title: "Verwerking van persoonsgegevens",
		paragraphs: [
			"De door de huurder meegedeelde persoonsgegevens (naam, adres, telefoonnummer, e-mailadres) worden door de verhuurder uitsluitend verwerkt met het oog op de uitvoering van deze overeenkomst en het beheer van de reservatie, en worden niet aan derden doorgegeven behoudens wettelijke verplichting.",
			"De huurder heeft het recht op inzage, verbetering en verwijdering van zijn gegevens door contact op te nemen met de verhuurder via de contactgegevens vermeld op de website van KLJ Wolfsdonk."
		]
	},
	{
		title: "Elektronische ondertekening",
		paragraphs: [
			"Partijen aanvaarden uitdrukkelijk dat deze overeenkomst elektronisch tot stand komt via een door de huurder op het scherm geplaatste handtekening. Deze handtekening geldt als een gewone elektronische handtekening in de zin van Verordening (EU) nr. 910/2014 (eIDAS) en mag als bewijsmiddel niet louter omwille van haar elektronische vorm worden geweigerd.",
			"Partijen erkennen dat deze handtekening, gelet op de omstandigheden waarin ze geplaatst wordt en de identificatie van de huurder via de reservatie waaraan ze gekoppeld is, een geldig en afdwingbaar bewijs vormt van de instemming van de huurder met deze overeenkomst.",
			"Door de handtekening te plaatsen, verklaart de huurder kennis te hebben genomen van en akkoord te gaan met alle bepalingen van deze overeenkomst."
		]
	},
	{
		title: "Toepasselijk recht en bevoegde rechtbank",
		paragraphs: [
			"Deze overeenkomst wordt beheerst door het Belgisch recht.",
			"Elke betwisting met betrekking tot de geldigheid, interpretatie of uitvoering van deze overeenkomst behoort, voor zover wettelijk toegestaan, tot de bevoegdheid van de rechtbanken van het gerechtelijk arrondissement waar de verhuurder gevestigd is, onverminderd de dwingende wettelijke bepalingen inzake bevoegdheid ter bescherming van de consument."
		]
	},
	{
		title: "Slotbepalingen",
		paragraphs: [
			"Indien een bepaling van deze overeenkomst nietig of onafdwingbaar zou blijken, blijven de overige bepalingen onverminderd van kracht. Partijen verbinden zich ertoe de nietige bepaling te vervangen door een geldige bepaling die het beoogde doel zo veel mogelijk benadert.",
			"Deze overeenkomst, met inbegrip van de materiaallijst, vormt de volledige overeenkomst tussen partijen met betrekking tot het voorwerp ervan, en vervangt alle voorafgaande mondelinge of schriftelijke afspraken hieromtrent."
		]
	}
];
