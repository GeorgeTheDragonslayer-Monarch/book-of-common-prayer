window.MASS_ORDINARY_TEMPLATE = {
  "title": "The Holy Communion",
  "source": "Transcribed from pages/HolyMass/Mass.tex. Covers the fixed Ordinary (everything that doesn't change day to day) - the variable Propers (Introit, Collect, Epistle, Gospel, Offertory/Communion antiphons) are noted with a rubric where they occur but aren't provided by this page; see ROADMAP.md. Pending-corrections fix (10/2): the Lavabo (Psalm 26 verses said while the Priest washes his hands) is split into the Psalm text and its Gloria Patri as two separate sections, the Gloria Patri flagged `seasonalOmit: \"gloriaLavabo\"` - per Rubrics.tex's own 'Gloria Patri' entry ('During Passiontide, the Gloria Patri is omitted in the Invitatory of Mattins, Responsory of the Minor Hours, Aspersion of the People, Introit, and Lavabo'), checked the same way as Asperges's own Gloria Patri (task #190) via isPassiontideToday. Mass.tex itself gives no Passiontide-specific repeat for the Lavabo (unlike Asperges's own explicit 'the psalm simply being repeated' rubric), so none is added here - the Psalm is simply said without its doxology in Passiontide.",
  "adLibitumThirdCollect": {
    "source": "Transcribed from pages/Propers/Seasonal.tex:498-504 ('For Devoted Friends,' one of the ad libitum votive Collects listed there per the rubric at Seasonal.tex:93-95 - 'The following propers may also be used when ad libitum prayers are permitted.'). Per Augustine's 8/29 answer (Q7 of the release-audit list): the ad libitum third Collect/Secret/Postcommunion defaults to this text, fixed - no selection toggle needed.",
    "heading": "For Devoted Friends",
    "collect": "O God, who by the grace of thy Holy Spirit hast endued the hearts of thy faithful people with the gifts of charity: grant to thy servants and handmaids, for whom we implore thy mercy, safety of mind and body; that they may love thee with all their strength, and with pure affection perform such things as are acceptable unto thee. Through Jesus Christ thy Son our Lord, who liveth and reigneth with thee, in the unity of the Holy Ghost, God, throughout all ages, world without end. Amen.",
    "secret": "We beseech thee, O Lord, to have compassion upon thy servants and handmaids, for whom we offer unto thy majesty this sacrifice of praise: that through these holy things they may obtain the grace of thy heavenly benediction, and attain unto the glory of everlasting felicity. Through Jesus Christ thy Son our Lord, who liveth and reigneth with thee, in the unity of the Holy Ghost, God, throughout all ages, world without end. Amen.",
    "postcommunion": "O Lord, who dost make us to taste of these divine mysteries, we humbly beseech thee: that like as we have offered these sacraments of salvation for the advancement in charity of thy servants; so they may be profitable unto them for their prosperity and peace. Through Jesus Christ thy Son our Lord, who liveth and reigneth with thee, in the unity of the Holy Ghost, God, throughout all ages, world without end. Amen."
  },
  "sections": [
    {
      "type": "heading",
      "text": "Collect for Purity"
    },
    {
      "type": "rubric",
      "text": "The Priest, at the Foot of the Altar, saith the Collect for Purity, as followeth, in an audible voice."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Almighty God, unto whom all hearts are open, all desires known, and from whom no secrets are hid; Cleanse the thoughts of our hearts by the inspiration of thy Holy Spirit, that we may perfectly love thee, and worthily magnify thy holy Name; through Christ our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest, turning to the People, rehearse distinctly—in an audible voice—the Ten Commandments; and the People, still kneeling, shall, after every Commandment, ask God mercy for their transgressions for the time past, and grace to keep the law for the time to come."
    },
    {
      "type": "rubric",
      "text": "And Note, that in rehearsing the Ten Commandments, the Priest may omit that part of the Commandment which is inset."
    },
    {
      "type": "rubric",
      "text": "The Ten Commandments may be omitted. When ever it is omitted, the Minister shall say the Summary of the Law, beginning, {{Hear what our Lord Jesus Christ saith.}}"
    },
    {
      "type": "inlineToggle",
      "toggle": "commandments",
      "options": [
        {
          "value": "full",
          "label": "Ten Commandments"
        },
        {
          "value": "summary",
          "label": "Summary of the Law"
        }
      ]
    },
    {
      "type": "heading",
      "text": "Ten Commandments",
      "commandmentsOption": "full"
    },
    {
      "type": "text",
      "text": "God spake these words, and said:",
      "commandmentsOption": "full",
      "centeredSmallCaps": true
    },
    {
      "type": "versicle",
      "v": "I am the Lord thy God; Thou shalt have none other gods but me.",
      "r": "Lord, have mercy upon us, and incline our hearts to keep this law.",
      "commandmentsOption": "full"
    },
    {
      "type": "versicle",
      "v": "Thou shalt not make to thyself any graven image, nor the likeness of any thing that is in heaven above, or in the earth beneath, or in the water under the earth; thou shalt not bow down to them, nor worship them: %%for I the Lord thy God am a jealous God, and visit the sins of the fathers upon the children, unto the third and fourth generation of them that hate me; and show mercy unto thousands in them that love me and keep my commandments.%%",
      "r": "Lord, have mercy upon us, and incline our hearts to keep this law.",
      "commandmentsOption": "full"
    },
    {
      "type": "versicle",
      "v": "Thou shalt not take the Name of the Lord thy God in vain; %%for the Lord will not hold him guiltless, that taketh his Name in vain.%%",
      "r": "Lord, have mercy upon us, and incline our hearts to keep this law.",
      "commandmentsOption": "full"
    },
    {
      "type": "versicle",
      "v": "Remember that thou keep holy the Sabbath-day. %%Six days shalt thou labour, and do all that thou hast to do; but the seventh day is the Sabbath of the Lord thy God. In it thou shalt do no manner of work; thou, and thy son, and thy daughter, thy man-servant, and thy maid-servant, thy cattle, and the stranger that is within thy gates. For in six days the Lord made heaven and earth, the sea, and all that in them is, and rested the seventh day: wherefore the Lord blessed the seventh day, and hallowed it.%%",
      "r": "Lord, have mercy upon us, and incline our hearts to keep this law.",
      "commandmentsOption": "full"
    },
    {
      "type": "versicle",
      "v": "Honour thy father and thy mother; %%that thy days may be long in the land which the Lord thy God giveth thee.%%",
      "r": "Lord, have mercy upon us, and incline our hearts to keep this law.",
      "commandmentsOption": "full"
    },
    {
      "type": "versicle",
      "v": "Thou shalt do no murder.",
      "r": "Lord, have mercy upon us, and incline our hearts to keep this law.",
      "commandmentsOption": "full"
    },
    {
      "type": "versicle",
      "v": "Thou shalt not commit adultery.",
      "r": "Lord, have mercy upon us, and incline our hearts to keep this law.",
      "commandmentsOption": "full"
    },
    {
      "type": "versicle",
      "v": "Thou shalt not steal.",
      "r": "Lord, have mercy upon us, and incline our hearts to keep this law.",
      "commandmentsOption": "full"
    },
    {
      "type": "versicle",
      "v": "Thou shalt not bear false witness against thy neighbour.",
      "r": "Lord, have mercy upon us, and incline our hearts to keep this law.",
      "commandmentsOption": "full"
    },
    {
      "type": "versicle",
      "v": "Thou shalt not covet %%thy neighbour's house, thou shalt not covet thy neighbour's wife, nor his servant, nor his maid, nor his ox, nor his ass, nor any thing that is his.%%",
      "r": "Lord, have mercy upon us, and write all these thy laws in our hearts, we beseech thee.",
      "commandmentsOption": "full"
    },
    {
      "type": "heading",
      "text": "Summary of the Law",
      "commandmentsOption": "summary"
    },
    {
      "type": "rubric",
      "text": "Then may the Priest say the Summary of the Law, as followeth, in an audible voice.",
      "commandmentsOption": "summary"
    },
    {
      "type": "text",
      "centeredSmallCaps": true,
      "text": "Hear what our Lord Jesus Christ saith.",
      "commandmentsOption": "summary"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind. This is the first and great commandment. And the second is like unto it; Thou shalt love thy neighbour as thyself. On these two commandments hang all the Law and the Prophets.",
      "commandmentsOption": "summary"
    },
    {
      "type": "heading",
      "text": "Ascending the Altar"
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest turn towards the Altar and ascend, saying secretly,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Take away from us, we beseech thee, O Lord, our iniquities: that we may be worthy to enter with pure minds into the Holy of holies. Through Christ, our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "Then, with hands joined upon the Altar, the Priest saith, bowing (kissing the Altar at the middle),"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "We pray thee, O Lord, by the merits of thy Saints, * whose relics are here, and of all the Saints: that thou wouldest vouchsafe to pardon all my sins. Amen."
    },
    {
      "type": "rubric",
      "text": "At a solemn Mass, the Celebrant, before reading the Introit, shall bless the incense saying: {{Be thou bles ✠ sed by him in whose honour thou shalt be burnt. Amen.}}"
    },
    {
      "type": "rubric",
      "text": "Receiving the thurible from the Deacon, he censeth the Altar, saying nothing. Then the Deacon taketh the thurible from the Celebrant and censeth him only."
    },
    {
      "type": "heading",
      "text": "Introit"
    },
    {
      "type": "placeholder",
      "key": "introitOfDay"
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest move to the Epistle side and, signing himself with the sign of the Cross, begin the Introit: which finished, at the middle of the Altar, with joined hands, he saith alternately with the Ministers the {{Kyrie,}}"
    },
    {
      "type": "versicle",
      "v": "Lord, have mercy upon us.",
      "vLatin": "℣. Kyrie, eléison."
    },
    {
      "type": "versicle",
      "r": "Lord, have mercy upon us.",
      "rLatin": "℟. Kyrie, eléison."
    },
    {
      "type": "versicle",
      "v": "Lord, have mercy upon us.",
      "vLatin": "℣. Kyrie, eléison."
    },
    {
      "type": "versicle",
      "r": "Christ, have mercy upon us.",
      "rLatin": "℟. Christe, eléison."
    },
    {
      "type": "versicle",
      "v": "Christ, have mercy upon us.",
      "vLatin": "℣. Christe, eléison."
    },
    {
      "type": "versicle",
      "r": "Christ, have mercy upon us.",
      "rLatin": "℟. Christe, eléison."
    },
    {
      "type": "versicle",
      "v": "Lord, have mercy upon us.",
      "vLatin": "℣. Kyrie, eléison."
    },
    {
      "type": "versicle",
      "r": "Lord, have mercy upon us.",
      "rLatin": "℟. Kyrie, eléison."
    },
    {
      "type": "versicle",
      "v": "Lord, have mercy upon us.",
      "vLatin": "℣. Kyrie, eléison."
    },
    {
      "type": "rubric",
      "text": "The Gloria in Excelsis is omitted in Masses of {{Advent,}} Septuagesimatide, and Lent.",
      "seasonalOmitNotice": "gloriaMass"
    },
    {
      "type": "heading",
      "text": "Gloria in excelsis",
      "seasonalOmit": "gloriaMass"
    },
    {
      "type": "rubric",
      "text": "Then the Priest shall, at the middle of the Altar, extend and join his hands and—bowing his head slightly—say,",
      "seasonalOmit": "gloriaMass"
    },
    {
      "type": "collect",
      "seasonalOmit": "gloriaMass",
      "text": "Glory be to God on high, and on earth peace, good will towards men. We praise thee, we bless thee, we worship thee, [[(Bow head.)]] we glorify thee, we give thanks [[(Bow head.)]] to thee for thy great glory, O Lord God, heavenly King, God the Father Almighty.\nO Lord, the only-begotten Son, Jesus Christ; O Lord God, Lamb of God, Son of the Father, that takest away the sins of the world, have mercy upon us. Thou that takest away the sins of the world, receive our prayer. [[(Bow head.)]] Thou that sittest at the right hand of God the Father, have mercy upon us.\nFor thou only art holy; thou only art the Lord; thou only, O Christ, with the Holy Ghost, ✠ art most high in the glory of God the Father. Amen.",
      "textLatin": "Glória in excélsis Deo. Et in terra pax homínibus bonæ voluntátis. Laudámus te. Benedícimus te. Adorámus te. [[(Bow head.)]] Glorificámus te. Grátias ágimus tibi [[(Bow head.)]] propter magnam glóriam tuam. Dómine Deus, Rex cæléstis, Deus Pater omnípotens.\nDómine Fili unigénite, Jesu Christe. Dómine Deus, Agnus Dei, Fílius Patris. Qui tollis peccáta mundi, miserére nobis. Qui tollis peccáta mundi, súscipe deprecatiónem nostram. [[(Bow head.)]] Qui sedes ad déxteram Patris, miserére nobis.\nQuóniam tu solus Sanctus. Tu solus Dóminus. Tu solus Altíssimus, Jesu Christe. Cum Sancto Spíritu ✠ in glória Dei Patris. Amen."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest kiss the Altar in the middle, turn to the People, extend his hands, and say,"
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "vLatin": "℣. Dóminus vobíscum."
    },
    {
      "type": "versicle",
      "r": "And with thy spirit.",
      "rLatin": "℟. Et cum spíritu tuo."
    },
    {
      "type": "versicle",
      "v": "Let us pray.",
      "vLatin": "℣. Orémus."
    },
    {
      "type": "heading",
      "text": "Collect"
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest move to the Epistle corner of the Altar and pray the Collect(s) of the Day."
    },
    {
      "type": "placeholder",
      "key": "collectOfDay"
    },
    {
      "type": "heading",
      "text": "Epistle"
    },
    {
      "type": "rubric",
      "text": "The Epistle for the Day shall then be read by the Subdeacon."
    },
    {
      "type": "placeholder",
      "key": "epistleOfDay"
    },
    {
      "type": "rubric",
      "text": "The Epistle ended, he shall say, {{Here endeth the Epistle,}} the people responding, {{Thanks be to God.}}"
    },
    {
      "type": "rubric",
      "text": "The Gradual and Alleluia (or Tract) and (if provided) Sequence is here chanted by the Choir."
    },
    {
      "type": "placeholder",
      "key": "gradualOfDay"
    },
    {
      "type": "heading",
      "text": "Gospel"
    },
    {
      "type": "rubric",
      "text": "These being ended, if it be a Solemn Mass, the Deacon shall then place the book of the Gospels on the middle of the Altar, and the Celebrant shall bless the incense with the {{Be thou blessed,}} as above."
    },
    {
      "type": "rubric",
      "text": "Then shall the Deacon kneeling before the Altar (or the Priest only bowing in the midst of the Altar) say with joined hands,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Cleanse my heart and my lips, O almighty God, who didst cleanse the lips of the prophet Isaiah with a live coal: so of thy gracious mercy vouchsafe to cleanse me, that I may worthily proclaim thy holy Gospel. Through Christ, our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "If a Deacon is present:"
    },
    {
      "type": "text",
      "text": "Deacon. Bid, sir, a blessing.\nPriest. The Lord be in thy heart and on thy lips: that thou mayest worthily and fitly proclaim his Gospel: In the name of the Father, and of the Son, ✠ and of the Holy Ghost. Amen."
    },
    {
      "type": "rubric",
      "text": "If the Priest celebrates without a Deacon:"
    },
    {
      "type": "text",
      "text": "Priest. Bid, Lord, a blessing.\nPriest. The Lord be in my heart and on my lips: that I may worthily and fitly proclaim his Gospel."
    },
    {
      "type": "rubric",
      "text": "Having received the blessing, the Deacon kisseth the hand of the Celebrant. And going with the other Ministers, with the incense and the lights, to the place of the Gospel, he standeth with joined hands."
    },
    {
      "type": "rubric",
      "text": "Then, the People standing, the Deacon, turning to the Book, saith with joined hands,"
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "vLatin": "℣. Dóminus vobíscum."
    },
    {
      "type": "versicle",
      "r": "And with thy spirit.",
      "rLatin": "℟. Et cum spíritu tuo."
    },
    {
      "type": "placeholder",
      "key": "gospelIncipit"
    },
    {
      "type": "rubric",
      "text": "Then shall the Deacon sign the book with the thumb of his right hand at the beginning of the Gospel text which he is to read, then himself on the forehead, the mouth, and the breast: and while the Ministers respond, he censeth the book thrice, then readeth the Gospel with joined hands."
    },
    {
      "type": "placeholder",
      "key": "gospelOfDay"
    },
    {
      "type": "rubric",
      "text": "At the end of the Gospel, the Ministers respond,"
    },
    {
      "type": "versicle",
      "r": "Praise be to thee, O Christ.",
      "rLatin": "℟. Laus tibi, Christe."
    },
    {
      "type": "rubric",
      "text": "Then shall the Subdeacon carry the book to the Priest, who kisseth the Gospel text, saying: {{Through the words of the Gospel may our sins be blotted out.}} Then the Priest is censed by the Deacon.\nNote, In Masses of the Dead, {{Cleanse}} is said, but a blessing is not asked, lights are not carried, and the Celebrant doth not kiss the book."
    },
    {
      "type": "rubric",
      "text": "Then, in the middle of the Altar, extending, raising, and joining his hands, the Priest shall say,",
      "seasonalOmit": "creedMass"
    },
    {
      "type": "heading",
      "text": "Nicene Creed",
      "seasonalOmit": "creedMass"
    },
    {
      "type": "collect",
      "text": "I believe in one God [[(Bow head to Cross.)]] the Father Almighty, Maker of heaven and earth, And of all things visible and invisible:\nAnd in one Lord Jesus Christ, [[(Bow head to Cross.)]] the only-begotten Son of God; Begotten of his Father before all worlds, God of God, Light of Light, Very God of very God; Begotten, not made; Being of one substance with the Father; By whom all things were made: Who for us men and for our salvation came down from heaven, [[(Everyone genuflects.)]] And was incarnate by the Holy Ghost of the Virgin Mary, And was made man: [[(Everyone rises.)]] And was crucified also for us under Pontius Pilate; He suffered and was buried: And the third day he rose again according to the Scriptures: And ascended into heaven, And sitteth on the right hand of the Father: And he shall come again, with glory, to judge both the quick and the dead; Whose kingdom shall have no end.\nAnd I believe in the Holy Ghost, The Lord, and Giver of Life, Who proceedeth from the Father; Who with the Father and the Son together is worshiped [[(Bow head to Cross.)]] and glorified; Who spake by the Prophets: And I believe one, holy, catholic, and apostolic Church: I acknowledge one Baptism for the remission of sins: And I look for the Resurrection of the dead: ✠ And the Life of the world to come. Amen.",
      "textLatin": "Credo in unum Deum, [[(Bow head to Cross.)]] Patrem omnipoténtem, factórem cæli et terræ, visibílium ómnium et invisibílium.\nEt in unum Dóminum Jesum Christum, [[(Bow head to Cross.)]] Fílium Dei unigénitum. Et ex Patre natum ante ómnia sǽcula. Deum de Deo, lumen de lúmine, Deum verum de Deo vero. Génitum, non factum, consubstantiálem Patri: per quem ómnia facta sunt. Qui propter nos hómines et propter nostram salútem descéndit de cælis. [[(Everyone genuflects.)]] Et incarnátus est de Spíritu Sancto ex María Vírgine: Et homo factus est. [[(Everyone rises.)]] Crucifíxus étiam pro nobis: sub Póntio Piláto passus, et sepúltus est. Et resurréxit tértia die, secúndum Scriptúras. Et ascéndit in cælum: sedet ad déxteram Patris. Et íterum ventúrus est cum glória judicáre vivos et mórtuos: cujus regni non erit finis.\nEt in Spíritum Sanctum, Dóminum et vivificántem: qui ex Patre procédit. Qui cum Patre et Fílio simul adorátur [[(Bow head to Cross.)]] et conglorificátur: qui locútus est per Prophétas. Et unam sanctam cathólicam et apostólicam Ecclésiam. Confíteor unum baptísma in remissiónem peccatórum. Et exspécto resurrectiónem mortuórum. ✠ Et vitam ventúri sæculi. Amen.",
      "seasonalOmit": "creedMass"
    },
    {
      "type": "rubric",
      "text": "Then shall be declared unto the People what Holy-days, or Fasting-days, are in the week following to be observed; and (if occasion be) shall Notice be given of the Communion, and of the Banns of Matrimony, and other matters to be published."
    },
    {
      "type": "rubric",
      "text": "Here, or immediately after the Creed, may be said the Bidding Prayer, or other authorized Prayers and intercessions."
    },
    {
      "type": "biddingPrayer",
      "heading": "A Bidding Prayer",
      "rubric": "To be used to preface Sermons, or on Special Occasions.",
      "source": "pages/Prayers/PrayersThanksgivings.tex, \"A Bidding Prayer\" - a 1928 BCP-derived form dating to the reign of Henry VIII, printed in the source between two %-commented editorial notes but never itself commented out. Not previously transcribed into any data file; sourced here for the 8/23 note asking for a show/hide toggle (defaulting hidden) in place of the bare one-line rubric that used to be all Mass Ordinary had for it. The source's own trailing third Lord's Prayer/Hail Mary repetition is commented out and not resurrected, matching this project's established practice elsewhere.",
      "parts": [
        {
          "type": "text",
          "dropcap": true,
          "text": "After a laudable custom of our Mother holy Church, ye shall kneel down, moving your hearts unto Almighty God, and making your special prayers for the three estates, concerning all Christian people, that is, for the Spirituality, the Temporality, and the souls departed."
        },
        {
          "type": "text",
          "dropcap": true,
          "text": "First for all archbishops, and bishops, and in special for my Lord Archbishop of these United States, your Metropolitan, and also for my Lord Bishop of this Diocese, and in general for all parsons, vicars, and parish priests having cure of souls, with the ministers of Christ's Church, as well monastic as not monastic."
        },
        {
          "type": "text",
          "dropcap": true,
          "text": "Secondly, ye shall pray for the unity and peace of all Christian Realms. And for the noble Realm of America, and for the President of these United States; that Almighty God may send them grace, so to govern and rule the land, that it may be pleasing unto Almighty God, wealth and profit to the land, and salvation to their souls. Also ye shall pray for all those that have honoured the Church with light, lamp, vestment, or bell, or with any other ornaments, by which the service of Almighty God is the better maintained and kept. Furthermore ye shall pray for all true travellers and tillers of the earth, that truly and duly done their duty to God and holy Church, as they be bound to do."
        },
        {
          "type": "text",
          "text": "Also ye shall pray for all manner of fruits that be done upon the ground, or shall be that Almighty God of his great pity and mercy may send such weather, that it may come to the sustenance of man. Ye shall pray also for all those that be in debt or deadly sin, that Almighty God may give them grace to come out thereof, and the sooner by our prayer. Also ye shall pray for all those that be sick or diseased, either in body or in soul, that the Almighty would send them the thing that is most profitable as well bodily as ghostly. Also ye shall pray for all pilgrims, and palmers, that have taken the way to Rome, to Saint James of Jerusalem, or to any other place: that Almighty God may give them grace to go safe, and to come safe, and give us grace to have part of their prayers, and they part of ours. Also ye shall pray for the holy Cross, that is in possession and hands of unrightful people; that God Almighty may send it into the hands of Christian people when it pleaseth him. Furthermore I commit unto your devout prayers, all women that be in our ladies' bonds: that Almighty God may send them grace, the child to receive the Sacrament of Baptism, and the mother purification. Also ye shall pray for the good man and woman, that this day giveth bread to make the holy loaf, and for all those that first began it, and them that longest continue. For these and for all true Christian people, every man and woman say the Lord's Prayer and the Angelic Salutation."
        },
        {
          "type": "rubric",
          "text": "The Priest and the People say,"
        },
        {
          "type": "text",
          "dropcap": true,
          "text": "Our Father, who art in heaven, Hallowed be thy Name. Thy kingdom come. Thy will be done on earth, As it is in heaven. Give us this day our daily bread. And forgive us our trespasses, As we forgive those who trespass against us. And lead us not into temptation; But deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever and ever. Amen."
        },
        {
          "type": "text",
          "dropcap": true,
          "text": "Hail Mary, full of grace; The Lord is with thee; Blessed art thou amongst women, And blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, Pray for us sinners, now and at the hour of our death. Amen."
        },
        {
          "type": "rubric",
          "text": "The Priest then says,"
        },
        {
          "type": "text",
          "dropcap": true,
          "text": "Ye shall make a special prayer for your fathers' souls, for your mothers' souls, godfathers' souls and godmothers' souls, brothers' souls and sisters' souls, and for all your elders' souls, and for all the souls, that ye or I be bound to pray for, and specially for all the souls whose bones are buried in this Church or in this Churchyard, or in any other holy place, and especially for all the souls that bid the great mercy of Almighty God, that God for his great mercy release them of their pain, if it be his blessed will, and that our prayers may sum what stand them in stead; every man and woman of your charity help them with the Lord's Prayer and the Angelic Salutation."
        },
        {
          "type": "rubric",
          "text": "The Priest and the People again say,"
        },
        {
          "type": "text",
          "dropcap": true,
          "text": "Our Father, who art in heaven, Hallowed be thy Name. Thy kingdom come. Thy will be done on earth, As it is in heaven. Give us this day our daily bread. And forgive us our trespasses, As we forgive those who trespass against us. And lead us not into temptation; But deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever and ever. Amen."
        },
        {
          "type": "text",
          "dropcap": true,
          "text": "Hail Mary, full of grace; The Lord is with thee; Blessed art thou amongst women, And blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, Pray for us sinners, now and at the hour of our death. Amen."
        }
      ]
    },
    {
      "type": "rubric",
      "text": "Then followeth the Sermon."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest ascend the Altar, kiss it, turn towards the People, and say,"
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "vLatin": "℣. Dóminus vobíscum."
    },
    {
      "type": "versicle",
      "r": "And with thy spirit.",
      "rLatin": "℟. Et cum spíritu tuo."
    },
    {
      "type": "versicle",
      "v": "Let us pray.",
      "vLatin": "℣. Orémus."
    },
    {
      "type": "heading",
      "text": "Offertory"
    },
    {
      "type": "placeholder",
      "key": "offertoryOfDay"
    },
    {
      "type": "rubric",
      "text": "Note, At High Mass, a Hymn may be sung while the Priest prepareth the Oblations in the Offertory, and while the Collection is taken, if there be one."
    },
    {
      "type": "heading",
      "text": "Offering the Bread"
    },
    {
      "type": "rubric",
      "text": "Then shall the Deacon present the Paten with the Bread to the Celebrant, which he then offereth, saying,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Receive, O holy Father, almighty everlasting God, this spotless host, which I, thine unworthy servant, offer unto thee, my living and true God, for my numberless sins, offences, and negligences, and for all who stand around, as also for all faithful Christians, both living and departed: that to me and to them it may avail for salvation unto life eternal. Amen."
    },
    {
      "type": "rubric",
      "text": "Then, making a cross with the same Paten, he shall place the Bread upon the Corporal (or the Paten with the Bread upon the Corporal)."
    },
    {
      "type": "heading",
      "text": "Offering the Wine"
    },
    {
      "type": "rubric",
      "text": "Then the Deacon shall minister the Wine, and the Subdeacon the Water into the Cup. The Priest (blessing with the sign of the Cross the Water to be mixed in the Cup, unless it be a Requiem Mass) shall say,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "O God, who didst wonderfully create, and yet more wonderfully renew the dignity of man's nature: grant that by the mystery of this water and wine we may be made partakers of his divinity, who vouchsafed to share our humanity, Jesus Christ thy Son our Lord: Who liveth and reigneth with thee in the unity of the Holy Ghost, God: throughout all ages world without end. Amen."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest receive the Cup and offer it, saying,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "We offer unto thee, O Lord, the cup of salvation, humbly beseeching thy mercy: that in the sight of thy divine majesty it may ascend as a sweet-smelling savour for our salvation, and for that of the whole world. Amen."
    },
    {
      "type": "heading",
      "text": "Offering the Gifts"
    },
    {
      "type": "rubric",
      "text": "Then shall he make the sign of the Cross with the Cup, place it upon the Corporal, and cover it with the Pall. Then, with hands joined upon the Altar, he saith, bowing slightly,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "In a humble spirit, and with a contrite heart, may we be accepted of thee, O Lord: and so let our sacrifice be offered in thy sight this day, that it may be pleasing unto thee, O Lord God."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest—standing upright—extend his hands, raise them, and join them; and lifting his eyes to heaven and lowering them immediately, he saith,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Come, O Sanctifier almighty, everlasting God, and bl ✠ ess this sacrifice, prepared for thy holy name."
    },
    {
      "type": "heading",
      "text": "Censing the Altar"
    },
    {
      "type": "rubric",
      "text": "If he be celebrating solemnly, the Priest blesseth incense, saying,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Through the intercession of blessed Michael the Archangel standing at the right hand of the altar of incense, and of all his elect, may the Lord vouchsafe to bl ✠ ess this incense, and receive it for a sweet-smelling savour. Through Christ, our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "Receiving the Thurible from the Deacon, he censeth the Oblations, in the manner prescribed in the traditional manner, saying,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "May this incense which thou hast blessed, ascend unto thee, O Lord: and let thy mercy descend upon us."
    },
    {
      "type": "rubric",
      "text": "Then the Priest censeth the Altar, saying,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Let my prayer, O Lord, be set forth in thy sight as the incense: and let the lifting up of my hands be an evening sacrifice. Set a watch, O Lord, before my mouth, and keep the door of my lips: O let not mine heart be inclined to any evil thing, let me not be occupied in ungodly works."
    },
    {
      "type": "rubric",
      "text": "While he returneth the Thurible to the Deacon, he saith,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "The Lord kindle in us the fire of his love, and the flame of everlasting charity. Amen."
    },
    {
      "type": "rubric",
      "text": "Then the Priest is censed by the Deacon, and afterwards the others in order."
    },
    {
      "type": "heading",
      "text": "Washing the Hands"
    },
    {
      "type": "rubric",
      "text": "Meanwhile, the Priest washeth his hands, saying,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "I will wash my hands in innocency, O Lord: and so will I go to thine altar: That I may shew the voice of thanksgiving, and tell of all thy wondrous works. Lord, I have loved the habitation of thy house and the place where thine honour dwelleth. O shut not up my soul with the sinners, nor my life with the blood-thirsty: In whose hands is wickedness: and their right hand is full of gifts. But as for me, I will walk innocently: O deliver me, and be merciful unto me. My foot standeth right: I will praise the Lord in the congregations."
    },
    {
      "type": "text",
      "text": "Glory be to the Father, and to the Son, and to the Holy Ghost. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
      "seasonalOmit": "gloriaLavabo"
    },
    {
      "type": "heading",
      "text": "Offering the Oblation"
    },
    {
      "type": "rubric",
      "text": "Then bowing slightly, in the middle of the Altar with hands joined upon it, he saith,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Receive, O holy Trinity, this oblation which we offer unto thee in memory of the Passion, Resurrection, and Ascension of Jesus Christ, our Lord: and in honour of Blessed Mary ever Virgin, of Blessed John Baptist, of the Holy Apostles Peter and Paul, of these, and of all the Saints: that it may avail to their honour, and for our salvation: and may they, whose memory we celebrate on earth, vouchsafe to intercede for us in heaven. Through the same Christ, our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest kiss the Altar and, turning to the People, extend and join his hands, and say, raising his voice a little,"
    },
    {
      "type": "versicle",
      "v": "Pray, brethren: that my sacrifice and yours may be acceptable to God the Father Almighty.",
      "vLatin": "℣. Oráte, fratres: ut meum ac vestrum sacrifícium acceptábile fiat apud Deum Patrem omnipoténtem."
    },
    {
      "type": "versicle",
      "r": "The Lord receive this sacrifice at thy hands, to the praise and glory of his Name, both to our benefit, and that of all his holy Church",
      "rLatin": "℟. Suscípiat Dóminus sacrifícium de mánibus tuis ad laudem et glóriam nominis sui, ad utilitátem quoque nostram, totiúsque Ecclésiæ suæ sanctæ."
    },
    {
      "type": "rubric",
      "text": "The Priest saith in a low voice: {{Amen.}}"
    },
    {
      "type": "heading",
      "text": "Secret Prayers"
    },
    {
      "type": "placeholder",
      "key": "secretOfDay"
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest, with hands extended, immediately (without {{Let us pray}}), add the Secret Prayers.\nNote, When these are ended, he saith in a loud voice,"
    },
    {
      "type": "text",
      "text": "℣. Throughout all ages, world without end.\n℟. Amen."
    },
    {
      "type": "rubric",
      "text": "Then shall the Deacon say,"
    },
    {
      "type": "text",
      "text": "Let us pray for the whole state of Christ's Church."
    },
    {
      "type": "rubric",
      "text": "The Priest then saith, with hands extended, the following."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Almighty and everliving God, who by thy holy Apostle hast taught us to make prayers, and supplications, and to give thanks for all men; We humbly beseech thee most mercifully to accept our (alms and) oblations, and to receive these our prayers, which we offer unto thy Divine Majesty; beseeching thee to inspire continually the Universal Church with the spirit of truth, unity, and concord: And grant that all those who do confess thy holy Name may agree in the truth of thy holy Word, and live in unity and godly love."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "We beseech thee also, so to direct and dispose the hearts of all Christian Rulers, that they may truly and impartially administer justice, to the punishment of wickedness and vice, and to the maintenance of thy true religion, and virtue."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Give grace, O heavenly Father, to all Bishops and other Ministers, and especially to thy servant N. our Metropolitan (and N. our Bishop), that he may, both by his life and doctrine, set forth thy true and lively Word, and rightly and duly administer thy holy Sacraments."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "And to all thy People give thy heavenly grace; and especially to this congregation here present; that, with meek heart and due reverence, they may hear, and receive thy holy Word; truly serving thee in holiness and righteousness all the days of their life."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "And we most humbly beseech thee, of thy goodness, O Lord, to comfort and succour all those who, in this transitory life, are in trouble, sorrow, need, sickness, or any other adversity."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "And we also bless thy holy Name for all thy servants departed this life in thy faith and fear; beseeching thee to grant them continual growth in thy love and service, and to give us grace so to follow their good examples, chiefly the Blessed Virgin Mary, Mother of thy Son Jesus Christ our Lord and God, and the Holy Patriarchs, Prophets, Apostles, and Martyrs, that with them we may be partakers of thy heavenly kingdom."
    },
    {
      "type": "rubric",
      "text": "The Priest placeth both hands upon the Altar, outside the Corporal, and continueth,"
    },
    {
      "type": "text",
      "text": "Grant this, O Father, for Jesus Christ's sake, our only Mediator and Advocate."
    },
    {
      "type": "versicle",
      "r": "Amen."
    },
    {
      "type": "heading",
      "text": "Preface"
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest begin the Preface, with both hands placed apart on the Altar."
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "vLatin": "℣. Dóminus vobíscum."
    },
    {
      "type": "versicle",
      "r": "And with thy spirit.",
      "rLatin": "℟. Et cum spíritu tuo."
    },
    {
      "type": "versicle",
      "v": "Lift up your hearts. [[(He raises his hands a little.)]]",
      "vLatin": "℣. Sursum corda. [[(He raises his hands a little.)]]"
    },
    {
      "type": "versicle",
      "r": "We lift them up unto the Lord.",
      "rLatin": "℟. Habémus ad Dóminum."
    },
    {
      "type": "versicle",
      "v": "Let us give thanks unto our Lord God. [[(He joins his hands before his breast, & bows his head.)]]",
      "vLatin": "℣. Grátias agámus Dómino, Deo nostro. [[(He joins his hands before his breast, & bows his head.)]]"
    },
    {
      "type": "versicle",
      "r": "It is meet and right so to do.",
      "rLatin": "℟. Dignum et justum est."
    },
    {
      "type": "rubric",
      "text": "The Priest separateth his hands and continueth with the following."
    },
    {
      "type": "text",
      "text": "It is very meet, right, and our bounden duty, that we should at all times, and in all places, give thanks unto thee, O Lord, Holy Father, Almighty, Everlasting God."
    },
    {
      "type": "placeholder",
      "key": "properPreface"
    },
    {
      "type": "text",
      "text": "Therefore with Angels and Archangels, and with all the company of heaven, we laud and magnify thy glorious Name; evermore praising thee, and saying: [[(He joins his hands & bows.)]]"
    },
    {
      "type": "heading",
      "text": "Sanctus"
    },
    {
      "type": "collect",
      "text": "Holy, Holy, Holy, Lord God of hosts, Heaven and earth are full of thy glory: Glory be to thee, O Lord Most High. Blessed [[(He stands upright & signs himself.)]] ✠ is he that cometh in the Name of the Lord. Hosanna in the Highest.",
      "textLatin": "Sanctus, Sanctus, Sanctus, Dóminus, Deus Sábaoth. Pleni sunt cæli et terra glória tua. Glória tibi, Dómine altíssime. Benedíctus, [[(He stands upright & signs himself.)]] ✠ qui venit in nómine Dómini. Hosánna in excélsis."
    },
    {
      "type": "heading",
      "text": "Canon of the Mass"
    },
    {
      "type": "rubric",
      "text": "The Priest, extending, raising somewhat, and joining his hands, raising his eyes towards heaven, and immediately lowering them, shall begin the Canon, as followeth."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "All glory be to thee, Almighty God, our heavenly Father, for that thou, of thy tender mercy, didst give thine only Son Jesus Christ to suffer death upon the Cross for our redemption; who (by his own oblation of himself once offered) made a full, perfect, and sufficient sacrifice, oblation, and satisfaction, for the sins of the whole world; and did institute, and in his holy Gospel command us to continue, a perpetual memory of that his precious death and sacrifice, until his coming again:"
    },
    {
      "type": "heading",
      "text": "Words of Institution"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "For in the night in which he was betrayed, (a) he took Bread; (b) and when he had given ✠ thanks, he brake it, and gave it to his disciples, saying, Take, eat, (c)"
    },
    {
      "type": "text",
      "institutionWords": true,
      "text": "This is my Body, which is given for you;\nDo this in remembrance of me."
    },
    {
      "type": "ceremonialNotes",
      "notes": [
        {
          "letter": "a",
          "text": "He takes & holds the Bread."
        },
        {
          "letter": "b",
          "text": "He looks up to heaven & bows his head."
        },
        {
          "letter": "c",
          "text": "He holds the Bread between both of his thumbs & forefingers."
        }
      ]
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest immediately genuflect, briefly elevate the Bread for the People to see, replace it upon the Corporal (or Paten), genuflect again, and then immediately continue. Note, from henceforth, the Priest doth not disjoin his forefingers & thumbs until the ablutions."
    },
    {
      "type": "text",
      "text": "Likewise, after supper, (d) he took the Cup; (e) and when he had given ✠ thanks, he gave it to them, saying, Drink ye all of this; for (f)"
    },
    {
      "type": "text",
      "institutionWords": true,
      "text": "This is my Blood of the New Testament, which is shed for you, and for many, for the remission of sins;"
    },
    {
      "type": "ceremonialNotes",
      "notes": [
        {
          "letter": "d",
          "text": "He uncovers the Cup, holds it with both hands, & bows his head."
        },
        {
          "letter": "e",
          "text": "He holds the Cup in his left hand."
        },
        {
          "letter": "f",
          "text": "He holds the Cup slightly raised."
        }
      ]
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest place the Cup back upon the Corporal and immediately say,"
    },
    {
      "type": "text",
      "institutionWords": true,
      "text": "Do this, as oft as ye shall drink it, in remembrance of me."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest immediately genuflect, briefly elevate the Cup, replace the Cup upon the Corporal, cover it, genuflect again, and continue with hands extended."
    },
    {
      "type": "heading",
      "text": "Recollection"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Wherefore O Lord and heavenly Father, according to the institution of thy dearly beloved Son our Saviour Jesus Christ, we, thy humble servants, do celebrate and make here before thy Divine Majesty, with these thy holy ✠ gifts, which we now offer unto thee, the memorial thy Son hath commanded us to make; having in remembrance his blessed passion and precious death, his mighty resurrection and glorious ascension; rendering unto thee most hearty thanks for the innumerable benefits procured unto us by the same."
    },
    {
      "type": "heading",
      "text": "Invocation"
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest uncover the Cup, bow profoundly, join his hands upon the Altar, and continue,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "And we thine unworthy servants beseech thee, most merciful Father, to hear us, (g) and to send thy Holy Spirit upon us and upon the ✠ se thy gifts and creatures of Br ✠ ead and W ✠ ine, that, being blessed and hallowed by his life-giving power, they may become the Bo ✠ dy and Bl ✠ ood of thy most dearly beloved Son, to the end that all who shall receive the same may be sanctified both in body and soul, and preserved unto everlasting life."
    },
    {
      "type": "ceremonialNotes",
      "notes": [
        {
          "letter": "g",
          "text": "He stands upright and imposes his hands over the Gifts."
        }
      ]
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest cover the Cup, genuflect, and continue, with hands extended,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "And we earnestly desire thy fatherly goodness, mercifully to accept this our Sacrifice of Praise and Thanksgiving; most humbly beseeching thee to grant that, by the merits and death of thy Son Jesus Christ, and through faith in his Blood, we, and all thy whole Church, may obtain remission of our sins, and all other benefits of his Passion."
    },
    {
      "type": "heading",
      "text": "Commemoration for the Departed"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Remember also, O Lord, thy servants and handmaids N. and N., who have gone before us with the sign of faith, and rest in the sleep of peace."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest join his hands, pray for the dead he hath in mind, then extend his hands and say,"
    },
    {
      "type": "text",
      "text": "To them, O Lord, and to all that rest in Christ, we beseech thee to grant a place of refreshing, light, and peace."
    },
    {
      "type": "heading",
      "text": "Oblation"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "And here we offer and present unto thee, O Lord, our selves, our souls and bodies, to be a reasonable, holy, and living sacrifice unto thee; humbly beseeching thee, [[(He kisses the Altar)]] that we, and all others who shall be partakers of this Holy Communion, may worthily receive the most precious Bo ✠ dy and Bl ✠ ood (h) of thy Son Jesus Christ, be filled with thy grace and heavenly benediction, and made one body with him, that he may dwell in us, and we in him."
    },
    {
      "type": "ceremonialNotes",
      "notes": [
        {
          "letter": "h",
          "text": "After signing the Gifts, he signs himself."
        }
      ]
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "And although we are unworthy, through our manifold sins, to offer unto thee any sacrifice; yet we beseech thee to accept this our bounden duty and service; not weighing our merits, but pardoning our offences. [[(He joins his hands & bows his head profoundly.)]]"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Through Jesus Christ our Lord; (i) by ✠ whom, and with wh ✠ om, in the unity of the Holy ✠ Ghost, (j) all ho ✠ nour and gl ✠ ory be unto thee, O Father Almighty, world without end."
    },
    {
      "type": "ceremonialNotes",
      "notes": [
        {
          "letter": "i",
          "text": "He genuflects & makes the sign the Cross with the Host over the Cup thrice, from lip to lip."
        },
        {
          "letter": "j",
          "text": "He makes the sign of the Cross twice with the Host between the Cup & his breast."
        }
      ]
    },
    {
      "type": "rubric",
      "text": "The Priest then uncovereth the Cup, elevateth the Host and Cup to the height of his breast then replacing them on the Altar, covereth the Cup, genuflecteth, then joineth his hands."
    },
    {
      "type": "versicle",
      "r": "Amen."
    },
    {
      "type": "heading",
      "text": "Lord's Prayer"
    },
    {
      "type": "text",
      "text": "Let us pray. And now, as our Saviour Christ hath taught us, we are bold to say,"
    },
    {
      "type": "rubric",
      "text": "The Priest alone extendeth his hands while the Priest and Congregation say together,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Our Father, who art in heaven, Hallowed be thy Name. Thy kingdom come. Thy will be done, on earth, As it is in heaven. Give us this day our daily bread. And forgive us our trespasses, As we forgive those who trespass against us. And lead us not into temptation, But deliver us from evil. For thine is the kingdom, and the power, and the glory, for ever and ever. Amen."
    },
    {
      "type": "rubric",
      "text": "Unless the Priest consecrated on the Paten, he takes the Paten between the fore and middle fingers of his right hand, and holds it upright upon the Altar."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Deliver us, O Lord, we beseech thee, from all evils, past, present, and to come: and at the intercession of the blessed and glorious ever Virgin Mary, Mother of God, with thy blessed Apostles Peter and Paul, and with Andrew, and all the Saints, [[(The Priest signs himself—with the Paten, if he consecrated on the Corporal)]] favourably grant peace in our days: that by the help of thine availing mercy we may ever both be free from sin and safe from all distress."
    },
    {
      "type": "rubric",
      "text": "If the Host be not already on the Paten, the Priest is to slide the Paten underneath the Host. He then shall uncover the Cup, genuflect, and break the Host in half over the Cup, saying,"
    },
    {
      "type": "text",
      "text": "Through the same Jesus Christ, thy Son our Lord."
    },
    {
      "type": "rubric",
      "text": "The Priest placeth the half in his right hand upon the Paten. He then breaketh a particle off from the half in his left hand, saying,"
    },
    {
      "type": "text",
      "text": "Who liveth and reigneth with thee in the unity of the Holy Ghost, God."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest join the other half, which he holdeth in his left hand, to the half laid upon the Paten, and retaining the small particle in his right hand over the Cup, which he holdeth with his left by the knop below the Cup, say in an audible voice, or sing,"
    },
    {
      "type": "text",
      "text": "Throughout all ages world without end.\n℟. Amen."
    },
    {
      "type": "rubric",
      "text": "With the same particle, the Priest signs thrice over the Cup, saying,"
    },
    {
      "type": "versicle",
      "v": "The peace ✠ of the Lord be ✠ alway with ✠ you.",
      "vLatin": "℣. Pax ✠ Dómini sit ✠ semper vobís ✠ cum."
    },
    {
      "type": "versicle",
      "r": "And with thy spirit.",
      "rLatin": "℟. Et cum spíritu tuo."
    },
    {
      "type": "rubric",
      "text": "The Priest, putting the same particle into the Cup, saith, in the secret voice:"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "May this commixture and consecration of the Body and Blood of our Lord Jesus Christ be to us who receive it unto everlasting life. Amen."
    },
    {
      "type": "heading",
      "text": "Agnus Dei"
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest cover the Cup, genuflect, and—bowing to the Sacrament—join his hands and strike his breast thrice, saying in an audible voice:"
    },
    {
      "type": "collect",
      "text": "O Lamb of God, that takest away the sins of the world, have mercy upon us.",
      "textLatin": "Agnus Dei, qui tollis peccáta mundi: miserére nobis.",
      "requiemText": "O Lamb of God, that takest away the sins of the world, grant them rest.",
      "requiemTextLatin": "Agnus Dei, qui tollis peccáta mundi: dona eis réquiem."
    },
    {
      "type": "collect",
      "text": "O Lamb of God, that takest away the sins of the world, have mercy upon us.",
      "textLatin": "Agnus Dei, qui tollis peccáta mundi: miserére nobis.",
      "requiemText": "O Lamb of God, that takest away the sins of the world, grant them rest.",
      "requiemTextLatin": "Agnus Dei, qui tollis peccáta mundi: dona eis réquiem."
    },
    {
      "type": "collect",
      "text": "O Lamb of God, that takest away the sins of the world, grant us thy peace.",
      "textLatin": "Agnus Dei, qui tollis peccáta mundi: dona nobis pacem.",
      "requiemText": "O Lamb of God, that takest away the sins of the world, grant them rest everlasting.",
      "requiemTextLatin": "Agnus Dei, qui tollis peccáta mundi: dona eis réquiem sempitérnam."
    },
    {
      "type": "rubric",
      "text": "In Requiem Masses, {{Have mercy upon us}} is replaced by {{grant them rest}} and {{grant us thy peace}} by {{grant them rest everlasting.}}"
    },
    {
      "type": "heading",
      "text": "Confession"
    },
    {
      "type": "rubric",
      "text": "Then the Deacon turneth to the People and saith to those who come to receive the Holy Communion,"
    },
    {
      "type": "text",
      "text": "Ye who do truly and earnestly repent you of your sins, and are in love and charity with your neighbours, and intend to lead a new life, following the commandments of God, and walking from henceforth in his holy ways; Draw near with faith, and take this holy Sacrament to your comfort; and make your humble confession to Almighty God, devoutly kneeling.",
      "dropcap": true
    },
    {
      "type": "rubric",
      "text": "Then shall this General Confession be made, in an audible voice, by the Priest, bowing, and all those who are minded to receive the Holy Communion, humbly kneeling."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Almighty God, Father of our Lord Jesus Christ, Maker of all things, Judge of all men; We acknowledge and bewail our manifold sins and wickedness, Which we, from time to time, most grievously have committed, By thought, word, and deed, Against thy Divine Majesty, Provoking most justly thy wrath and indignation against us. We do earnestly repent, And are heartily sorry for these our misdoings; The remembrance of them is grievous unto us; The burden of them is intolerable. Have mercy upon us, Have mercy upon us, most merciful Father; For thy Son our Lord Jesus Christ's sake, Forgive us all that is past; And grant that we may ever hereafter Serve and please thee in newness of life, To the honour and glory of thy Name; Through Jesus Christ our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest (Bishop if he be present) stand up and, turning to the People, say,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Almighty God, our heavenly Father, who of his great mercy hath promised forgiveness of sins to all those who with hearty repentance and true faith turn unto him; Have mercy upon you; pardon ✠ and deliver you from all your sins; confirm and strengthen you in all goodness; and bring you to everlasting life; through Jesus Christ our Lord."
    },
    {
      "type": "text",
      "text": "℟. Amen."
    },
    {
      "type": "heading",
      "text": "Comfortable Words"
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest, facing the People, say,"
    },
    {
      "type": "comfortableWords",
      "attribution": "Hear what comfortable words our Saviour Christ saith unto all who truly turn to him.",
      "quotes": [
        {
          "text": "Come unto me, all ye that travail and are heavy laden, and I will refresh you.",
          "citation": "Matt. 11:28"
        },
        {
          "text": "So God loved the world, that he gave his only-begotten Son, to the end that all that believe in him should not perish, but have everlasting life.",
          "citation": "John 3:16"
        }
      ]
    },
    {
      "type": "comfortableWords",
      "attribution": "Hear also what Saint Paul saith.",
      "quotes": [
        {
          "text": "This is a true saying, and worthy of all men to be received, That Christ Jesus came into the world to save sinners.",
          "citation": "1 Tim. 1:15"
        }
      ]
    },
    {
      "type": "comfortableWords",
      "attribution": "Hear also what Saint John saith.",
      "quotes": [
        {
          "text": "If any man sin, we have an Advocate with the Father, Jesus Christ the righteous; and he is the Propitiation for our sins.",
          "citation": "1 John 2:1-2"
        }
      ]
    },
    {
      "type": "rubric",
      "text": "Then the Priest, turning to the Altar, bowing with hands joined upon the Altar, saith in the secret voice,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "O Lord Jesu Christ, who saidst to thine Apostles: Peace I leave with you, my peace I give unto you: regard not my sins but the faith of thy Church; and vouchsafe to grant her peace and unity according to thy will: Who livest and reignest God, throughout all ages, world without end. Amen."
    },
    {
      "type": "rubric",
      "text": "If the {{Pax}} be given, the Priest is to kiss the Altar and, giving the {{Pax}}, say,"
    },
    {
      "type": "versicle",
      "v": "Peace be with thee.",
      "vLatin": "℣. Pax tecum."
    },
    {
      "type": "versicle",
      "r": "And with thy spirit.",
      "rLatin": "℟. Et cum spíritu tuo."
    },
    {
      "type": "heading",
      "text": "Prayer of Humble Access"
    },
    {
      "type": "rubric",
      "text": "The Priest alone then saith, in an audible voice,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "We do not presume to come to this thy Table, O merciful Lord, trusting in our own righteousness, but in thy manifold and great mercies. We are not worthy so much as to gather up the crumbs under thy Table. But thou art the same Lord, whose property is always to have mercy: Grant us therefore, gracious Lord, so to eat the flesh of thy dear Son Jesus Christ, and to drink his blood, that our sinful bodies may be made clean by his Body, and our souls washed through his most precious Blood, and that we may evermore dwell in him, and he in us.\n℟. Amen."
    },
    {
      "type": "collapsibleGroup",
      "heading": "Pre-Communion Hymn",
      "rubric": "After the Priest returneth to the Altar, the Pre-Communion Hymn is to then be sung as communicants approach the Altar Rail. Note, The Pre-Communion Hymn may be said or sung any time after the Prayer of Humble Access.",
      "toggleLabel": "Show the Pre-Communion Hymn",
      "source": "pages/HolyMass/PreCommunionHymn.tex - the words underlying resources/gabc/PreCommunion.gabc's chant setting (this site does not render musical notation, only the words); the source's own chant-score punctuation (bullet points marking a lifted voice, asterisks marking the chant's mediant pause) is omitted here as performance notation, not part of the text proper - same convention already used for every other gabc-only passage on this site (see ROADMAP.md).",
      "parts": [
        {
          "type": "text",
          "dropcap": true,
          "text": "I believe, O Lord, and I confess that thou art truly the Christ, the Son of the Living God, Who didst come into the world to save sinners, of whom I am first. And I believe that this is truly thine own immaculate Body, and that this is truly thine own precious Blood. Wherefore I pray thee: have mercy upon me and forgive my transgressions both voluntary and involuntary, Of word and of deed, of knowledge and of ignorance. And make me worthy to partake without condemnation of thine immaculate Mysteries, unto the remission of my sins and unto life everlasting. Amen."
        },
        {
          "type": "text",
          "dropcap": true,
          "text": "Of thy Mystical Supper, O Son of God, accept me today as a communicant; for I will not speak of thy Mystery to thine enemies, neither will I give thee a kiss as did Judas; but like the thief will I confess thee: Remember me, O Lord in thy Kingdom."
        },
        {
          "type": "text",
          "dropcap": true,
          "text": "Not unto judgement, nor unto condemnation, be my partaking of thy holy Mysteries, O Lord, but unto the healing of soul and body."
        }
      ]
    },
    {
      "type": "heading",
      "text": "Communion of the Priest"
    },
    {
      "type": "rubric",
      "text": "Then the Priest shall say that which followeth,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "O Lord Jesu Christ, Son of the living God, who by the will of the Father, and the co-operation of the Holy Ghost, hast through thy death given life unto the world: deliver me by this thy most sacred Body and Blood from all mine iniquities, and from every evil: and make me ever to cleave unto thy commandments, and suffer me never to be separated from thee: Who with the same God the Father and the Holy Ghost livest and reignest God, world without end. Amen."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Let the partaking of thy Body, O Lord Jesu Christ, which I, unworthy, presume to receive, turn not to my judgement and condemnation: but of thy goodness let it avail unto me for protection of mind and of body, that I may receive thy healing: Who livest and reignest with God the Father in the unity of the Holy Ghost, God, throughout all ages, world without end. Amen."
    },
    {
      "type": "rubric",
      "text": "He then genuflecteth and saith: {{I will receive the bread of heaven, and call upon the name of the Lord.}}"
    },
    {
      "type": "rubric",
      "text": "Then, bowing slightly, the Priest shall take both parts of the Host between the thumb and forefinger of his left hand, and place the Paten between the same forefinger and middle finger, and striking his breast three times with his right hand, say thrice, devoutly and humbly, raising his voice slightly:"
    },
    {
      "type": "text",
      "text": "Lord, I am not worthy, (Proceeding in the secret voice:) that thou shouldest come under my roof: but speak the word only, and my soul shall be healed."
    },
    {
      "type": "rubric",
      "text": "After signing himself with his right hand with the Host over the Paten, he saith,"
    },
    {
      "type": "text",
      "text": "The Body of our Lord Jesus Christ preserve my soul unto everlasting life. Amen."
    },
    {
      "type": "rubric",
      "text": "And bowing, he reverently taketh both parts of the Host. After consuming the Host, he is to place the Paten down upon the Corporal, and raising himself, join his hands, and remain still for a short time in meditation on the Most Holy Sacrament."
    },
    {
      "type": "rubric",
      "text": "Then he shall uncover the Cup, genuflect, collect the fragments (if there be any), and cleanse the Paten over the Cup, saying meanwhile:"
    },
    {
      "type": "text",
      "text": "What reward shall I give unto the Lord for all the benefits that he hath done unto me? I will receive the cup of salvation, and call upon the Name of the Lord. I will call upon the Lord which is worthy to be praised, so shall I be safe from mine enemies."
    },
    {
      "type": "rubric",
      "text": "Taking the Cup in his right hand and signing himself with it, he saith,"
    },
    {
      "type": "text",
      "text": "The Blood of our Lord Jesus Christ preserve my soul unto everlasting life. Amen."
    },
    {
      "type": "rubric",
      "text": "Holding the Paten under the Cup with his left hand, the Priest is to reverently receive the Blood with the particle."
    },
    {
      "type": "rubric",
      "text": "Having received, if there be any to be communicated, let him communicate them before he purifieth himself."
    },
    {
      "type": "heading",
      "text": "Communion of the People"
    },
    {
      "type": "rubric",
      "text": "If there be any to be communicated, the Priest shall genuflect and place the consecrated particles in a Ciborium (or if there are few to be communicated, on the Paten), unless from the beginning they had been placed in a Ciborium."
    },
    {
      "type": "rubric",
      "text": "If the Priest is to administer Communion from the reserved Sacrament, he openeth the Tabernacle, genuflecteth, taketh out the Ciborium, & placeth it upon the Corporal."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest genuflect, take the Ciborium with his left hand (or the Cup, if he consecrated on the Paten), and take one particle with his right hand takes, which he holdeth between his thumb and forefinger slightly raised above the Ciborium (Cup); and turning to the people in the midst of the Altar, he saith in the clear voice:"
    },
    {
      "type": "versicle",
      "v": "Behold the Lamb of God. Behold him who taketh away the sins of the world.",
      "vLatin": "℣. Ecce Agnus Dei, ecce, qui tollit peccáta mundi."
    },
    {
      "type": "versicle",
      "r": "Lord, I am not worthy that thou shouldest come under my roof, but speak the word only, and my soul shall be healed.",
      "rLatin": "℟. Dómine, non sum dignus, ut intres sub tectum meum, sed tantum dic verbo, et sanábitur ánima mea."
    },
    {
      "type": "versicle",
      "r": "Lord, I am not worthy that thou shouldest come under my roof, but speak the word only, and my soul shall be healed.",
      "rLatin": "℟. Dómine, non sum dignus, ut intres sub tectum meum, sed tantum dic verbo, et sanábitur ánima mea."
    },
    {
      "type": "versicle",
      "r": "Lord, I am not worthy that thou shouldest come under my roof, but speak the word only, and my soul shall be healed.",
      "rLatin": "℟. Dómine, non sum dignus, ut intres sub tectum meum, sed tantum dic verbo, et sanábitur ánima mea."
    },
    {
      "type": "rubric",
      "text": "Only Orthodox Christians in good standing and properly disposed may receive the Eucharist.\nNote, Each communicant shall receive the Communion kneeling."
    },
    {
      "type": "rubric",
      "text": "If they are to communicate, the Priest first communicateth the Sacred Ministers, and then the other Priests and Clerics in choir. (Priest and Deacons shall wear a stole either of white colour or of the same colour as the administering Priest.) And last of all, he proceedeth to communicate the others, beginning with those on the Epistle side."
    },
    {
      "type": "heading",
      "text": "Distribution of the Body & Blood Separately"
    },
    {
      "type": "rubric",
      "text": "If both kinds are to be administered separately, the Priest, when giving the Body, shall make with the Host the sign of the Cross over the Ciborium and place the Host on the tongue of each communicant, while saying:"
    },
    {
      "type": "text",
      "text": "The Body of our Lord Jesus Christ, which was given for thee, preserve thy body and soul unto everlasting life. Take and eat this in remembrance that Christ died for thee, and feed on him in thy heart by faith, with thanksgiving."
    },
    {
      "type": "rubric",
      "text": "And then, while administering the Cup to each communicant, the Priest, keeping hold of the Cup, shall say:"
    },
    {
      "type": "text",
      "text": "The Blood of our Lord Jesus Christ, which was shed for thee, preserve thy body and soul unto everlasting life. Drink this in remembrance that Christ's Blood was shed for thee, and be thankful."
    },
    {
      "type": "heading",
      "text": "Distribution of the Body & Blood Together"
    },
    {
      "type": "rubric",
      "text": "But if the Body and Blood of Christ are to be administered together by intinction, then the Priest, when giving the Sacrament to each one, intincteth the Host into the Cup; then, making with the Host the sign of the Cross over the Cup, he placeth the Host on the tongue of each communicant, while saying:"
    },
    {
      "type": "text",
      "text": "The Body of our Lord Jesus Christ which was given for thee, and his Blood which was shed for thee. Take them in remembrance that Christ died for thee, and feed on him in thy heart by faith with thanksgiving."
    },
    {
      "type": "rubric",
      "text": "The Communion ended, the Priest shall return to the Altar, saying nothing, nor doth he give the Blessing since he will give it at the end of Mass."
    },
    {
      "type": "heading",
      "text": "Ablutions"
    },
    {
      "type": "rubric",
      "text": "When the faithful have received Holy Communion, the Deacon and Priest return the Blessed Sacrament to the Altar. The Priest shall then consume everything not being reserved.\nNote, When prepared for reservation, the Host shall be touched with the Blood, the Blood then being completely consumed."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest say,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Grant, O Lord, that what we have taken with our mouths we may receive with a pure heart: and from a temporal gift may it become to us an everlasting remedy."
    },
    {
      "type": "rubric",
      "text": "Meanwhile, he presenteth the Cup to the Minister, who shall pour in a little wine and water, wherewith he purifieth himself. Then he continueth,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Let thy Body, O Lord, which I have taken, and thy Blood which I have drunk, cleave to my members: and grant; that no stain of sin may remain in me, whom thou hast refreshed with pure and holy sacraments: Who livest and reignest, world without end. Amen."
    },
    {
      "type": "rubric",
      "text": "Then shall the Priest wash and wipe his fingers and take the ablution. Then he wipeth his mouth and the Cup."
    },
    {
      "type": "rubric",
      "text": "After folding the Corporal, he is to cover the Cup and place it upon the Altar as before. Then he proceedeth with the Mass."
    },
    {
      "type": "heading",
      "text": "Thanksgiving"
    },
    {
      "type": "rubric",
      "text": "Standing with his hands joined, the Priest shall read the Communion Antiphon. Then, at the Epistle corner, he alone saith the Thanksgiving, in an audible voice."
    },
    {
      "type": "placeholder",
      "key": "communionOfDay"
    },
    {
      "type": "versicle",
      "v": "Let us pray.",
      "vLatin": "℣. Orémus."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Almighty and everliving God, we most heartily thank thee, for that thou dost vouchsafe to feed us who have duly received these holy mysteries with the spiritual food of the most precious Body and Blood of thy Son our Saviour Jesus Christ; and dost assure us thereby of thy favour and goodness towards us; and that we are very members incorporate in the mystical body of thy Son, which is the blessed company of all faithful people; and are also heirs through hope of thy everlasting kingdom, by the merits of his most precious death and passion. And we humbly beseech thee, O heavenly Father, so to assist us with thy grace, that we may continue in that holy fellowship, and do all such good works as thou hast prepared for us to walk in; through Jesus Christ our Lord, to whom, with thee and the Holy Ghost, be all honour and glory, world without end.\n℟. Amen."
    },
    {
      "type": "heading",
      "text": "Dismissal"
    },
    {
      "type": "rubric",
      "text": "Then, with hands joined before his breast, the Priest shall proceed to the midst of the Altar, kiss the Altar, and turn to the People, with hands extended, saying:"
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "vLatin": "℣. Dóminus vobíscum."
    },
    {
      "type": "versicle",
      "r": "And with thy spirit.",
      "rLatin": "℟. Et cum spíritu tuo."
    },
    {
      "type": "rubric",
      "text": "Then, turning back to the Book, he saith:"
    },
    {
      "type": "versicle",
      "v": "Let us pray.",
      "vLatin": "℣. Orémus."
    },
    {
      "type": "heading",
      "text": "Postcommunion Prayers"
    },
    {
      "type": "rubric",
      "text": "The Priest then saith the Postcommunion Prayers in the same manner, number, and order as the Collects at the beginning of Mass."
    },
    {
      "type": "placeholder",
      "key": "postcommunionOfDay"
    },
    {
      "type": "heading",
      "text": "Final Blessing"
    },
    {
      "type": "rubric",
      "text": "After saying the last Prayer, the Priest is to return to the midst of the Altar, kissing it, and turning toward the people, saying:"
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "vLatin": "℣. Dóminus vobíscum."
    },
    {
      "type": "versicle",
      "r": "And with thy spirit.",
      "rLatin": "℟. Et cum spíritu tuo."
    },
    {
      "type": "rubric",
      "text": "On days when the {{Gloria in excelsis}} is said,",
      "finalBlessingVariant": "gloriaSaid"
    },
    {
      "type": "versicle",
      "v": "Depart in peace.",
      "vLatin": "℣. Ite, Missa est.",
      "finalBlessingVariant": "gloriaSaid"
    },
    {
      "type": "versicle",
      "r": "Thanks be to God.",
      "rLatin": "℟. Deo grátias.",
      "finalBlessingVariant": "gloriaSaid"
    },
    {
      "type": "rubric",
      "text": "On days when the {{Gloria in excelsis}} is not said,",
      "finalBlessingVariant": "gloriaOmitted"
    },
    {
      "type": "versicle",
      "v": "Let us bless the Lord.",
      "vLatin": "℣. Benedicámus Dómino.",
      "finalBlessingVariant": "gloriaOmitted"
    },
    {
      "type": "versicle",
      "r": "Thanks be to God.",
      "rLatin": "℟. Deo grátias.",
      "finalBlessingVariant": "gloriaOmitted"
    },
    {
      "type": "rubric",
      "text": "In Requiem Masses,",
      "finalBlessingVariant": "requiem"
    },
    {
      "type": "versicle",
      "v": "May they rest in peace.",
      "vLatin": "℣. Requiéscant in pace.",
      "finalBlessingVariant": "requiem"
    },
    {
      "type": "versicle",
      "r": "Amen.",
      "rLatin": "℟. Amen.",
      "finalBlessingVariant": "requiem"
    },
    {
      "type": "rubric",
      "text": "In Eastertide, in Masses of the Season,",
      "finalBlessingVariant": "eastertide"
    },
    {
      "type": "versicle",
      "v": "Depart in peace, alleluia, alleluia.",
      "vLatin": "℣. Ite, Missa est, allelúja, allelúja.",
      "finalBlessingVariant": "eastertide"
    },
    {
      "type": "versicle",
      "r": "Thanks be to God, alleluia, alleluia.",
      "rLatin": "℟. Deo grátias, allelúja, allelúja.",
      "finalBlessingVariant": "eastertide"
    },
    {
      "type": "rubric",
      "text": "Having said the Dismissal, the Priest boweth before the midst of the Altar, and with hands joined thereon, saith in the secret voice,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Let this my bounden duty and service be pleasing to thee, O holy Trinity: and grant; that the sacrifice, which I unworthy have offered before the eyes of thy majesty, may be acceptable to thee, and through thy mercy obtain thy gracious favour for me and all for whom I have offered it. Through Christ, our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "Then—unless it be a Requiem Mass—the Congregation kneeling, the Priest shall kiss the Altar; raise his eyes; extend, raise, and join his hands; bow his head to the Cross; and give the Blessing, saying,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "The Peace of God, which passeth all understanding, keep your hearts and minds in the knowledge and love of God, and of his Son Jesus Christ our Lord: And the Blessing of God Almighty, [[(He turns to the people, blessing them once only, even in solemn Masses.)]] the Father, ✠ the Son, and the Holy Ghost, be amongst you, and remain with you always. Amen."
    },
    {
      "type": "rubric",
      "text": "In Pontifical Masses, the Blessing is given by the Bishop and is threefold, as ordered in the Pontifical."
    },
    {
      "type": "rubric",
      "text": "In Masses of the Dead, the Blessing is not given, but having said {{May they rest in peace}} and {{Let this my bounden duty,}} he kisseth the Altar and readeth the Last Gospel."
    },
    {
      "type": "heading",
      "text": "Last Gospel"
    },
    {
      "type": "rubric",
      "lastGospelOmitNotice": true,
      "text": "The Last Gospel is omitted today, since the Gospel of the Day is itself the Prologue of St. John (the same passage given below)."
    },
    {
      "type": "rubric",
      "lastGospelOmit": true,
      "text": "Unless a proper Last Gospel be provided, the Priest shall conclude the Mass with this Last Gospel, at the Gospel corner and with hands joined:"
    },
    {
      "type": "versicle",
      "lastGospelOmit": true,
      "v": "The Lord be with you.",
      "vLatin": "℣. Dóminus vobíscum."
    },
    {
      "type": "versicle",
      "lastGospelOmit": true,
      "r": "And with thy spirit.",
      "rLatin": "℟. Et cum spíritu tuo."
    },
    {
      "type": "versicle",
      "lastGospelOmit": true,
      "v": "The [[(He signs with the sign of the Cross first the Altar or the Book, then himself on the forehead, mouth, & breast.)]] ✠ beginning of the Holy Gospel according to John.",
      "vLatin": "℣. Inítium [[(He signs with the sign of the Cross first the Altar or the Book, then himself on the forehead, mouth, & breast.)]] ✠ sancti Evangélii secúndum Joánnem"
    },
    {
      "type": "versicle",
      "lastGospelOmit": true,
      "r": "Glory be to thee, O Lord.",
      "rLatin": "℟. Glória tibi, Dómine."
    },
    {
      "type": "collect",
      "lastGospelOmit": true,
      "text": "In the beginning was the Word, and the Word was with God, and the Word was God. The same was in the beginning with God. All things were made by him; and without him was not any thing made that was made. In him was life; and the life was the light of men. And the light shineth in darkness; and the darkness comprehended it not. There was a man sent from God, whose name was John. The same came for a witness, to bear witness of the Light, that all men through him might believe. He was not that Light, but was sent to bear witness of that Light. That was the true Light, which lighteth every man that cometh into the world. He was in the world, and the world was made by him, and the world knew him not. He came unto his own, and his own received him not. But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name: Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God. [[(Everyone genuflects.)]] And the Word was made flesh, and dwelt among us, [[(Everyone rises.)]] (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.\n℟. Thanks be to God.",
      "textLatin": "In princípio erat Verbum, et Verbum erat apud Deum, et Deus erat Verbum. Hoc erat in princípio apud Deum. Omnia per ipsum facta sunt: et sine ipso factum est nihil, quod factum est: in ipso vita erat, et vita erat lux hóminum: et lux in ténebris lucet, et ténebræ eam non comprehendérunt.\nFuit homo missus a Deo, cui nomen erat Joánnes. Hic venit in testimónium, ut testimónium perhibéret de lúmine, ut omnes créderent per illum. Non erat ille lux, sed ut testimónium perhibéret de lúmine.\nErat lux vera, quæ illúminat omnem hóminem veniéntem in hunc mundum. In mundo erat, et mundus per ipsum factus est, et mundus eum non cognóvit. In própria venit, et sui eum non recepérunt. Quotquot autem recepérunt eum, dedit eis potestátem fílios Dei fíeri, his, qui credunt in nómine ejus: qui non ex sanguínibus, neque ex voluntáte carnis, neque ex voluntáte viri, sed ex Deo nati sunt. [[(Everyone genuflects.)]] Et Verbum caro factum est, [[(Everyone rises.)]] et habitávit in nobis: et vídimus glóriam ejus, glóriam quasi Unigéniti a Patre, plenum grátiæ et veritátis.\n℟. Deo grátias."
    },
    {
      "type": "rubric",
      "text": "At High Mass, a Hymn may be sung while the Priest and ministers leave the sanctuary."
    },
    {
      "type": "rubric",
      "text": "As he departeth from the Altar, the Priest saith for thanksgiving the Antiphon \"{{Let us sing,}}\" with the rest."
    },
    {
      "type": "heading",
      "text": "General Rubrics"
    },
    {
      "type": "rubric",
      "text": "It is expedient to have, set upon the Altar, cards with the most common prayers."
    },
    {
      "type": "rubric",
      "text": "The Altar at the Communion-time—having a fair white linen cloth, a cross, and at least two candles upon it—shall stand in the Sanctuary."
    },
    {
      "type": "rubric",
      "text": "The Bread for the Eucharist ought to be provided by the Priest or the members of the Congregation. It must be leavened. That is, before and after being initially baked, it must be made of—and only made of—wheat flour, water, yeast, and salt. The Wine should be made of grapes, without additives or supplements. The Vessels should be made of precious metal."
    },
    {
      "type": "rubric",
      "text": "It is an ancient and laudable rule of the Church to receive this Holy Sacrament fasting. That is, one who desireth to receive the Eucharist must consume neither food nor drink (water excepted) from the midnight before the liturgy until the time of reception. In the case of Masses which occur after noon, it is sufficient that the fasting begin at noon or immediately after one's noon-time meal."
    }
  ]
};
