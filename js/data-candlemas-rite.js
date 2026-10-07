window.CANDLEMAS_RITE_TEMPLATE = {
  "title": "Blessing and Distribution of the Candles, and the Procession",
  "source": "Transcribed verbatim from pages/Propers/PropTime.tex lines ~380-480 (the Candlemas/Purification of the Blessed Virgin Mary entry, 2 February). Stops immediately before the Mass's own Introit, which the existing Mass Ordinary template (data/collects-sanctorale.json or data/collects-temporale.json, whichever holds the 2-2 entry) already renders - this file covers only the pre-Mass ceremony the Missal places before it: the Blessing of the Candles and the Procession. Per the source's own rubric ('If it happen that this Feast be transferred, only the Blessing and Distribution of the Candles and the Procession take place today'), this rite is tied to the calendar date 2 February itself, not to whichever Office/Mass actually wins that day - so js/app.js renders it on every 2 February regardless of ranking outcome. English-only lines are English-only because PropTime.tex itself gives no Latin for them (only the dialogue responses and a few versicles are given bilingually in the source, via \\elcol{}{}); nothing here is invented to fill that gap, per this project's standing no-fabrication rule.",
  "sections": [
    {
      "type": "heading",
      "text": "Blessing and Distribution of the Candles"
    },
    {
      "type": "rubric",
      "text": "If it happen that this Feast be transferred, only the Blessing and Distribution of the Candles and the Procession take place today. Mass is said of the Office occurring, and in it lighted Candles are not held in the hands."
    },
    {
      "type": "rubric",
      "text": "Mattins (or, Terce) being ended, the Priest vested in a violet Cope, or without a Chasuble, with the Ministers vested in like manner, proceeds to bless the Candles, which are placed in the midst before the Altar or at the Epistle corner, and he himself, standing in the same place facing the Altar, says with joined hands in the tone of the Collect of the Ferial Mass:"
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "r": "And with thy spirit.",
      "vLatin": "℣. Dóminus vobíscum.",
      "rLatin": "℟. Et cum spíritu tuo."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}",
      "textLatin": "Orémus."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O Lord Holy Father Almighty, everlasting God, who hast created all things out of nothing, and by thy command hast caused this liquid through the labour of bees to come to the perfection of wax: and who on this day didst fulfil the petition of Simeon the just: we humbly entreat thee; that through the invocation of thy most holy name and the intercession of blessed Mary ever Virgin, whose festival we this day devoutly celebrate, and through the prayers of all thy Saints, thou wouldest vouchsafe to bless and sanctify these candles for the use of men, and the health of their bodies and souls, whether on land or on water: and that from thy holy heaven, and from the seat of thy Majesty, thou wouldest hearken to the voices of this thy people, who desire to bear them in their hands to thine honour and to sing thy praises: and that thou wouldest be gracious to all that cry unto thee, whom thou hast redeemed with the precious Blood of thy Son: Who liveth and reigneth with thee. Amen."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Almighty and everlasting God, who on this day didst present thine only-begotten Son in thy holy temple, to be received in the arms of Saint Simeon: we humbly entreat thy mercy; that thou wouldest vouchsafe to bless, sanctify, and kindle with the light of thy heavenly benediction these candles, which we thy servants, receiving to the glory of thy name, desire to kindle and bear forth: to the intent that we, being made worthy by the offering of them unto thee, the Lord our God, and being enkindled with the holy fire of thy most sweet charity, may be found meet to be presented in the holy temple of thy glory. Through the same. Amen."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O Lord Jesu Christ, the true light, that lightenest every man that cometh into this world: pour forth thy blessing upon these candles, and sanctify them with the light of thy grace, and mercifully grant; that even as these lights, kindled with visible fire, do scatter the darkness of night; so our hearts, illumined by invisible fire, that is, by the brightness of the Holy Spirit, may be free from the blindness of every iniquity: that, the eyes of our minds being purified, we may be enabled to discern such things as are pleasing unto thee and profitable for our salvation; to the end that after the darkness and dangers of this world, we may be found meet to attain unto the light unfailing. Through thee, Christ Jesu, Saviour of the world, who in the perfect Trinity livest and reignest God. Amen."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Almighty and everlasting God, who through thy servant Moses didst command the purest liquid of oil to be prepared for the lamps to burn continually before thy face: mercifully pour upon these candles the grace of thy blessing; that they may so outwardly shed forth light, that, by thy gift, the light of thy Spirit may not inwardly be wanting to our souls. Through . . . in the unity of the same. Amen."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O Lord Jesu Christ, who on this day appearing among men in the substance of our flesh wast presented by thy parents in the temple: whom the old man, the venerable Simeon, illumined by the light of thy Spirit, acknowledged, received, and blessed: mercifully grant; that we, being enlightened and instructed by the grace of the same Holy Spirit, may truly acknowledge and faithfully love thee: Who livest and reignest with God the Father in the unity of the same Holy Spirit, God. Amen."
    },
    {
      "type": "rubric",
      "text": "The Prayers being ended, the Celebrant sets incense in the thurible; and thrice sprinkles the Candles with holy water, saying the Antiphon, {{Thou shalt purge me,}} without chant and without the Psalm: and then thrice incenses them."
    },
    {
      "type": "rubric",
      "text": "Then the senior of the Clergy approaches the Altar, and from him the Celebrant receives a Candle without genuflecting or kissing his hand. Then the Celebrant, standing in the midst before the Altar and turning to the people, distributes candles first to the senior, from whom he himself received; then to the Deacon and Subdeacon vested, and to the rest of the Clergy, one by one in order, lastly to the laity: all kneeling and kissing the Candle and the Celebrant's hand, with the exception of Prelates, if they be present. And when he begins to distribute the Candles the Choir sings:"
    },
    {
      "type": "text",
      "text": "Ant. A light to lighten the Gentiles and the glory of thy people Israel."
    },
    {
      "type": "text",
      "text": "Ant. Lord, now lettest thou thy servant depart in peace, according to thy word."
    },
    {
      "type": "rubric",
      "text": "Then is repeated the whole Antiphon, {{A light to lighten the Gentiles,}} which is likewise repeated after each Verse."
    },
    {
      "type": "text",
      "text": "For mine eyes have seen thy salvation. (Antiphon.)"
    },
    {
      "type": "text",
      "text": "Which thou hast prepared before the face of all people. (Antiphon.)"
    },
    {
      "type": "text",
      "text": "Glory be to the Father, and to the Son, and to the Holy Ghost. (Antiphon.)"
    },
    {
      "type": "text",
      "text": "As it was in the beginning, is now, and ever shall be, world without end. Amen. (Antiphon.)"
    },
    {
      "type": "rubric",
      "text": "These being ended, shall be sung:"
    },
    {
      "type": "text",
      "text": "Ant. O Lord, arise, help us: and deliver us for thy name's sake. Ps. O God, we have heard with our ears: our fathers have declared unto us. V. Glory be . . ."
    },
    {
      "type": "text",
      "text": "Ant. O Lord, arise, help us: and deliver us for thy name's sake."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}",
      "textLatin": "Orémus."
    },
    {
      "type": "rubric",
      "text": "If it be after Septuagesima, and not a Sunday, the Deacon says the following versicle."
    },
    {
      "type": "versicle",
      "v": "Let us bow the knee.",
      "vLatin": "℣. Flectámus génua."
    },
    {
      "type": "versicle",
      "v": "Arise.",
      "vLatin": "℣. Leváte."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "We beseech thee, O Lord, hearken unto thy people: and grant, that by the light of thy grace we may inwardly attain to those things, which in this yearly devotion thou dost suffer us outwardly to venerate. Through Christ, our Lord. Amen."
    },
    {
      "type": "heading",
      "text": "The Procession"
    },
    {
      "type": "rubric",
      "text": "Then follows the Procession. And first the Celebrant sets incense in the censer: then the Deacon, turning himself to the people, says: {{Let us proceed in peace.}} And the Choir answers: {{In the name of Christ. Amen.}}"
    },
    {
      "type": "rubric",
      "text": "The Thurifer goes first, with smoking thurible: then the Subdeacon vested, carrying the Cross, in the midst between two Acolytes with lighted candles: the Clergy follow in order, last of all the Celebrant with the Deacon on his left, all with lighted Candles in their hands: and the following Antiphons are sung:"
    },
    {
      "type": "text",
      "text": "Ant. O Sion, adorn thy bride-chamber, and receive Christ the King: greet Mary, who is the gate of heaven: for she beareth the King of the glory of the new light: she remaineth a Virgin, yet beareth in her hands a Son begotten before the morning star: whom Simeon took into his arms, declaring to the nations that he is the Lord of life and death, and Saviour of the world."
    },
    {
      "type": "text",
      "text": "Ant. It was revealed unto Simeon by the Holy Ghost, that he should not see death, before he had seen the Lord's Christ: and when they brought the Child into the temple, then took he him up in his arms, and blessed God, and said: Lord, now lettest thou thy servant depart in peace. V. When his parents brought in the Child Jesus, to do for him according to the custom of the law, then took he him up in his arms."
    },
    {
      "type": "rubric",
      "text": "As they enter the Church, the following is sung:"
    },
    {
      "type": "text",
      "text": "V. They offered for him unto the Lord a pair of turtle doves or two young pigeons: As it is written in the law of the Lord."
    },
    {
      "type": "text",
      "text": "V. When the days of Mary's purification according to the law of Moses were accomplished, they brought Jesus to Jerusalem, to present him to the Lord. As it is written in the law of the Lord."
    },
    {
      "type": "text",
      "text": "V. Glory be to the Father, and to the Son, and to the Holy Ghost. As it is written in the law of the Lord."
    },
    {
      "type": "rubric",
      "text": "The Procession being ended, the Celebrant and Ministers lay aside their violet vestments, and put on white for the Mass. And Candles are held in the hands lighted, while the Gospel is read, and again from the beginning of the Canon to the end of the Communion."
    },
    {
      "type": "rubric",
      "text": "Today any Votive Mass, even solemn, of Christ the Lord, is forbidden."
    },
    {
      "type": "rubric",
      "text": "The Mass is then said."
    }
  ]
}
