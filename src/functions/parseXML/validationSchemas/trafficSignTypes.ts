export const allowedTrafficSigns = [
  'A1.2 Mutka',
  'A1.1 Mutka',
  'A2.1 Mutkia',
  'A2.2 Mutkia',
  'A3.1 Jyrkkä mäki',
  'A3.2 Jyrkkä mäki',
  'A4 Kapeneva tie',
  'A5 Kaksisuuntainen liikenne',
  'A6 Avattava silta',
  'A7 Lautta, laituri tai ranta',
  'A8 Liikenneruuhka',
  'A9 Epätasainen tie',
  'A10 Töyssyjä',
  'A11 Tietyö',
  'A12 Irtokiviä',
  'A13 Liukas ajorata',
  'A14 Vaarallinen tienreuna',
  'A15 Suojatien ennakkovaroitus',
  'A16 Jalankulkijoita',
  'A17 Lapsia',
  'A18 Pyöräilijöitä',
  'A19 Hiihtolatu',
  'A20.1 Hirvi',
  'A20.2 Poro',
  'A20.3 Kauriseläin',
  'A21 Tienristeys',
  'A22.1 Sivutien risteys',
  'A22.2 Sivutien risteys',
  'A22.3 Sivutien risteys',
  'A22.4 Sivutien risteys',
  'A23 Liikennevalot',
  'A24 Liikenneympyrä',
  'A25 Raitiovaunu',
  'A26 Rautatien tasoristeys ilman puomeja',
  'A27 Rautatien tasoristeys, jossa on puomit',
  'A28.1 Rautatien tasoristeyksen lähestymismerkki',
  'A28.2 Rautatien tasoristeyksen lähestymismerkki',
  'A28.3 Rautatien tasoristeyksen lähestymismerkki',
  'A29.1 Tasoristeys',
  'A29.2 Tasoristeys',
  'A30 Putoavia kiviä',
  'A31 Matalalla lentäviä lentokoneita',
  'A32 Sivutuuli',
  'A33 Muu vaara',
  'B1 Etuajo-oikeutettu tie',
  'B1 Etuajo-oikeutettu tie',
  'B2 Etuajo-oikeuden päättyminen',
  'B3 Etuajo-oikeus kohdattaessa',
  'B4 Väistämisvelvollisuus kohdattaessa',
  'B5 Väistämisvelvollisuus risteyksessä',
  'B6 Pakollinen pysäyttäminen',
  'B7 Väistämisvelvollisuus pyöräilijän tienylityspaikassa',
  'C1 Ajoneuvolla ajo kielletty',
  'C2 Moottorikäyttöisellä ajoneuvolla ajo kielletty',
  'C3 Kuorma- ja pakettiautolla ajo kielletty',
  'C4 Ajoneuvoyhdistelmällä ajo kielletty',
  'C5 Traktorilla ajo kielletty',
  'C6 Moottoripyörällä ajo kielletty',
  'C7 Moottorikelkalla ajo kielletty',
  'C8 Vaarallisten aineiden kuljetus kielletty',
  'C9 Linja-autolla ajo kielletty',
  'C10 Mopolla ajo kielletty',
  'C11 Polkupyörällä ajo kielletty',
  'C12 Polkupyörällä ja mopolla ajo kielletty',
  'C13 Jalankulku kielletty',
  'C14 Jalankulku ja polkupyörällä ajo kielletty',
  'C15 Jalankulku ja polkupyörällä ja mopolla ajo kielletty',
  'C16 Ratsastus kielletty',
  'C17 Kielletty ajosuunta',
  'C18 Vasemmalle kääntyminen kielletty',
  'C19 Oikealle kääntyminen kielletty',
  'C20 U-käännös kielletty',
  'C21 Ajoneuvon suurin sallittu leveys',
  'C22 Ajoneuvon suurin sallittu korkeus',
  'C23 Ajoneuvon tai ajoneuvoyhdistelmän suurin sallittu pituus',
  'C24 Ajoneuvon suurin sallittu massa',
  'C25 Ajoneuvoyhdistelmän suurin sallittu massa',
  'C26 Ajoneuvon suurin sallittu akselille kohdistuva massa',
  'C27 Ajoneuvon suurin sallittu telille kohdistuva massa',
  'C28 Ohituskielto',
  'C29 Ohituskielto päättyy',
  'C30 Ohituskielto kuorma-autolla',
  'C31 Ohituskielto kuorma-autolla päättyy',
  'C32 Nopeusrajoitus',
  'C33 Nopeusrajoitus päättyy',
  'C34 Nopeusrajoitusalue',
  'C35 Nopeusrajoitusalue päättyy',
  'C36 Ajokaistakohtainen kielto, rajoitus tai määräys',
  'C37 Pysäyttäminen kielletty',
  'C38 Pysäköinti kielletty',
  'C39 Pysäköintikieltoalue',
  'C40 Pysäköintikieltoalue päättyy',
  'C41 Taksiasema-alue',
  'C42 Taksin pysäyttämispaikka',
  'C43 Kuormauspaikka',
  'C44.1 Vuoropysäköinti',
  'C44.2 Vuoropysäköinti',
  'C45 Pakollinen pysäyttäminen tullitarkastusta varten',
  'C46 Pakollinen pysäyttäminen tarkastusta varten',
  'C47 Moottorikäyttöisten ajoneuvojen vähimmäisetäisyys',
  'C48 Nastarenkailla varustetulla moottorikäyttöisellä ajoneuvolla ajo kielletty',
  'D1.1 Pakollinen ajosuunta',
  'D1.2 Pakollinen ajosuunta',
  'D1.3 Pakollinen ajosuunta',
  'D1.4 Pakollinen ajosuunta',
  'D1.5 Pakollinen ajosuunta',
  'D1.6 Pakollinen ajosuunta',
  'D1.7 Pakollinen ajosuunta',
  'D1.8 Pakollinen ajosuunta',
  'D1.9 Pakollinen ajosuunta',
  'D2 Pakollinen kiertosuunta',
  'D3.1 Liikenteenjakaja',
  'D3.2 Liikenteenjakaja',
  'D3.3 Liikenteenjakaja',
  'D4 Jalkakäytävä',
  'D5 Pyörätie',
  'D6 Yhdistetty pyörätie ja jalkakäytävä',
  'D7.1 Pyörätie ja jalkakäytävä rinnakkain',
  'D7.2 Pyörätie ja jalkakäytävä rinnakkain',
  'D8 Moottorikelkkailureitti',
  'D9 Ratsastustie',
  'D10 Vähimmäisnopeus',
  'D11 Vähimmäisnopeus päättyy',
  'E1 Suojatie',
  'E2 Pysäköintipaikka',
  'E3.1 Liityntäpysäköintipaikka',
  'E3.2 Liityntäpysäköintipaikka',
  'E3.3 Liityntäpysäköintipaikka',
  'E3.4 Liityntäpysäköintipaikka',
  'E3.5 Liityntäpysäköintipaikka',
  'E4.1 Ajoneuvojen sijoitus pysäköintipaikalla',
  'E4.2 Ajoneuvojen sijoitus pysäköintipaikalla',
  'E4.3 Ajoneuvojen sijoitus pysäköintipaikalla',
  'E5 Kohtaamispaikka',
  'E6 Linja-autopysäkki',
  'E7 Raitiovaunupysäkki',
  'E8 Taksiasema',
  'E9.1 Linja-autokaista',
  'E9.2 Linja-autokaista',
  'E10.1 Linja-autokaista päättyy',
  'E10.2 Linja-autokaista päättyy',
  'E11.1 Raitiovaunukaista',
  'E11.2 Raitiovaunukaista',
  'E12.1 Raitiovaunukaista päättyy',
  'E12.2 Raitiovaunukaista päättyy',
  'E13.1 Pyöräkaista',
  'E13.2 Pyöräkaista',
  'E14.1 Yksisuuntainen tie',
  'E14.2 Yksisuuntainen tie',
  'E15 Moottoritie',
  'E16 Moottoritie päättyy',
  'E17 Moottoriliikennetie',
  'E18 Moottoriliikennetie päättyy',
  'E19 Tunneli',
  'E20 Tunneli päättyy',
  'E21 Hätäpysäyttämispaikka',
  'E22 Taajama',
  'E23 Taajama päättyy',
  'E24 Pihakatu',
  'E25 Pihakatu päättyy',
  'E26 Kävelykatu',
  'E27 Kävelykatu päättyy',
  'E28 Pyöräkatu',
  'E29 Pyöräkatu päättyy',
  'E30 Ajokaistojen yhdistyminen',
  'F1.1 Suunnistustaulu',
  'F1.2 Suunnistustaulu',
  'F1.3 Suunnistustaulu',
  'F2.1 Suunnistustaulu',
  'F2.2 Suunnistustaulu',
  'F2.3 Suunnistustaulu',
  'F3 Ajokaistakohtainen suunnistustaulu',
  'F4.1 Kiertotien suunnistustaulu',
  'F4.2 Kiertotien suunnistustaulu',
  'F5 Kiertotieopastus',
  'F6 Ajoreittiopastus',
  'F7.1 Ajokaistaopastus',
  'F7.2 Ajokaistaopastus',
  'F7.3 Ajokaistaopastus',
  'F7.4 Ajokaistaopastus',
  'F7.5 Ajokaistaopastus',
  'F7.6 Ajokaistaopastus',
  'F8.1 Ajokaistan päättyminen',
  'F8.2 Ajokaistan päättyminen',
  'F9 Viitoituksen koontimerkki',
  'F10 Ajokaistan yläpuolinen viitta',
  'F11 Ajokaistan yläpuolinen viitta',
  'F12 Ajokaistan yläpuolinen erkanemisviitta',
  'F13 Tienviitta',
  'F14 Erkanemisviitta',
  'F15 Kiertotien viitta',
  'F16 Osoiteviitta',
  'F17 Osoiteviitan ennakkomerkki',
  'F18 Liityntäpysäköintiviitta',
  'F19 Jalankulun viitta',
  'F20.1 Pyöräilyn viitta',
  'F20.2 Pyöräilyn viitta',
  'F21.1 Pyöräilyn suunnistustaulu',
  'F21.2 Pyöräilyn suunnistustaulu',
  'F22 Pyöräilyn etäisyystaulu',
  'F23 Pyöräilyn paikannimi',
  'F24.1 Umpitie',
  'F24.2 Umpitie',
  'F25 Enimmäisnopeussuositus',
  'F26 Etäisyystaulu',
  'F27.1 Paikannimi',
  'F27.2 Paikannimi',
  'F28 Kansainvälisen pääliikenneväylän numero',
  'F29 Valtatien numero',
  'F30 Kantatien numero',
  'F30 Kantatien numero',
  'F31 Seututien numero',
  'F31 Seututien numero',
  'F32 Muun maantien numero',
  'F33 Kehätien numero',
  'F33 Kehätien numero',
  'F34 Eritasoliittymän numero',
  'F34 Eritasoliittymän numero',
  'F35 Opastus merkin tarkoittamalle tielle',
  'F35 Opastus merkin tarkoittamalle tielle',
  'F37 Moottoritien tunnus',
  'F38 Moottoriliikennetien tunnus',
  'F39 Lentoasema',
  'F40 Autolautta',
  'F41 Matkustajasatama',
  'F42 Tavarasatama',
  'F43 Tavaraterminaali',
  'F44 Teollisuusalue tai yritysalue',
  'F45 Vähittäiskaupan suuryksikkö',
  'F46.1 Pysäköinti',
  'F46.2 Pysäköinti',
  'F47 Rautatieasema',
  'F48 Linja-autoasema',
  'F49 Keskusta',
  'F50 Tietylle ajoneuvolle tarkoitettu reitti',
  'F51 Vaarallisten aineiden kuljetukselle tarkoitettu reitti',
  'F52 Jalankulkijalle tarkoitettu reitti',
  'F53 Esteetön reitti',
  'F54 Reitti, jolla on portaat',
  'F55 Reitti ilman portaita',
  'F56 Hätäuloskäynti',
  'F57 Poistumisreitti',
  'G1 Palvelukohteen opastustaulu',
  'G2 Palvelukohteen opastustaulu',
  'G3 Palvelukohteen erkanemisviitta',
  'G4 Palvelukohteen osoiteviitta',
  'G5 Palvelukohteen osoiteviitan ennakkomerkki',
  'G6 Radioaseman taajuus',
  'G7 Opastuspiste',
  'G8 Opastustoimisto',
  'G9 Ensiapu',
  'G10 Autokorjaamo',
  'G11.1 Polttoaineen jakelu',
  'G11.2 Polttoaineen jakelu',
  'G11.3 Polttoaineen jakelu',
  'G11.4 Polttoaineen jakelu',
  'G12 Hotelli tai motelli',
  'G13 Ruokailupaikka',
  'G14 Kahvila tai pikaruokapaikka',
  'G15 Käymälä',
  'G16 Retkeilymaja',
  'G17 Leirintäalue',
  'G18 Matkailuajoneuvoalue',
  'G19 Levähdysalue',
  'G20 Ulkoilualue',
  'G21 Hätäpuhelin',
  'G22 Sammutin',
  'G23 Museo tai historiallinen rakennus',
  'G24 Maailmanperintökohde',
  'G25 Luontokohde',
  'G26 Näköalapaikka',
  'G27 Eläintarha tai -puisto',
  'G28 Muu nähtävyys',
  'G29 Uintipaikka',
  'G30 Kalastuspaikka',
  'G31 Hiihtohissi',
  'G32 Maastohiihtokeskus',
  'G33 Golfkenttä',
  'G34 Huvi- ja teemapuisto',
  'G35 Mökkimajoitus',
  'G36 Aamiaismajoitus',
  'G37 Suoramyyntipaikka',
  'G38 Käsityöpaja',
  'G39 Kotieläinpiha',
  'G40 Ratsastuspaikka',
  'G41.1 Matkailutie',
  'G41.2 Matkailutie',
  'I1 Sulkupuomi',
  'I2.1 Sulkuaita',
  'I3.1 Sulkupylväs',
  'I3.2 Sulkupylväs',
  'I3.3 Sulkupylväs',
  'I4 Sulkukartio',
  'I5 Taustamerkki',
  'I6 Kaarteen suuntamerkki',
  'I7.1 Reunamerkki',
  'I7.2 Reunamerkki',
  'I8 Korkeusmerkki',
  'I9 Alikulun korkeusmitta',
  'I10.1 Liikennemerkkipylvään tehostamismerkki',
  'I10.2 Liikennemerkkipylvään tehostamismerkki',
  'I11 Erkanemismerkki',
  'I12.1 Reunapaalu',
  'I12.2 Reunapaalu',
  'I13 Siirtokehotus',
  'I14 Paikannusmerkki',
  'I15 Automaattinen liikennevalvonta',
  'I16 Tekninen valvonta',
  'I17.1 Poronhoitoalue',
  'I17.2 Poronhoitoalue',
  'I18 Yleinen nopeusrajoitus',
  'I19 Valtion raja'
];

export const allowedAdditionalPanel = [
  'H1 Kohde risteävässä suunnassa',
  'H2.1 Kohde nuolen suunnassa',
  'H2.2 Kohde nuolen suunnassa',
  'H2.3 Kohde nuolen suunnassa',
  'H3 Vaikutusalueen pituus',
  'H4 Etäisyys kohteeseen',
  'H5 Etäisyys pakolliseen pysäyttämiseen',
  'H6 Vapaa leveys',
  'H7 Vapaa korkeus',
  'H8 Sähköjohdon korkeus',
  'H9.1 Vaikutusalue molempiin suuntiin',
  'H9.2 Vaikutusalue molempiin suuntiin',
  'H10 Vaikutusalue nuolen suuntaan',
  'H11 Vaikutusalue päättyy',
  'H12.1 Henkilöauto',
  'H12.2 Linja-auto',
  'H12.3 Kuorma-auto',
  'H12.4 Pakettiauto',
  'H12.5 Matkailuperävaunu',
  'H12.6 Matkailuauto',
  'H12.7 Invalidin ajoneuvo',
  'H12.8 Moottoripyörä',
  'H12.9 Mopo',
  'H12.10 Polkupyörä',
  'H12.11 Moottorikelkka',
  'H12.12 Traktori',
  'H12.13 Vähäpäästöinen ajoneuvo',
  'H13.1 Pysäköintitapa',
  'H13.2 Pysäköintitapa',
  'H14 Kielto ryhmän A vaarallisten aineiden kuljetukselle',
  'H15 Läpiajokielto ryhmän B vaarallisten aineiden kuljetukselle',
  'H16 Tunneliluokka',
  'H17.1 Voimassaoloaika arkisin',
  'H17.2 Voimassaoloaika lauantaisin',
  'H17.3 Voimassaoloaika sunnuntaisin ja pyhinä',
  'H18 Aikarajoitus',
  'H19.1 Pysäköintiajan alkamisen osoittamisvelvollisuus',
  'H19.2 Pysäköintiajan alkamisen osoittamisvelvollisuus',
  'H20 Maksullinen pysäköinti',
  'H21 Latauspaikka',
  'H22.1 Etuajo-oikeutetun liikenteen suunta',
  'H22.2 Etuajo-oikeutetun liikenteen suunta',
  'H23.1 Kaksisuuntainen pyörätie',
  'H23.2 Kaksisuuntainen pyörätie',
  'H24 Tekstillinen lisäkilpi',
  'H25 Huoltoajo sallittu',
  'H26 Hätäpuhelin ja sammutin'
];