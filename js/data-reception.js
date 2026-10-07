window.RECEPTION_TEMPLATE = {
  "title": "Reception of Converts",
  "source": "Transcribed from pages/Pastoral/Reception.tex. English-only, matching the source (the Latin translation of the Veni Creator hymn and its collect is fully commented out there, not part of the currently typeset book). Psalm 51 is reused verbatim from data/psalter.json, and the Te Deum laudamus text is reused verbatim from the same textLines already verified for Mattins (data/mattins-template.json), split at the point the source itself marks as sung kneeling rather than retranscribed - both match the established convention of reusing fixed texts already used elsewhere on this site.",
  "sections": [
    {
      "type": "rubric",
      "text": "To be used for Catechumens who are not to be received by Baptism (conditional excepted), immediately before the Sacrament of Confirmation."
    },
    {
      "type": "rubric",
      "text": "If there be many such Catechumens, then each such Catechumen must recite the Profession of Faith and individually receive Absolution."
    },
    {
      "type": "rubric",
      "text": "The Priest, kneeling before the middle of the altar, says alternately with the attendants:"
    },
    {
      "type": "heading",
      "text": "Veni, Creator Spiritus"
    },
    {
      "type": "hymnStanzas",
      "stanzas": [
        "Come, Holy Ghost, Creator blest,\nVouchsafe within our souls to rest;\nCome with thy grace and heav'nly aid\nAnd fill the hearts which thou hast made.",
        "To thee, the Comforter, we cry,\nTo thee, the Gift of God Most High,\nThe Fount of life, the Fire of love,\nThe soul's Anointing from above.",
        "The sev'n-fold gifts of grace are thine,\nO Finger of the Hand Divine;\nTrue Promise of the Father thou,\nWho dost the tongue with speech endow.",
        "Thy light to every thought impart\nAnd shed thy love in every heart;\nThe weakness of our mortal state\nWith deathless might invigorate.",
        "Drive far away our wily foe,\nAnd thine abiding peace bestow;\nIf thou be our protecting Guide,\nNo evil can our steps betide.",
        "Make thou to us the Father known;\nTeach us th' eternal Son to own\nAnd thee, whose name we ever bless,\nOf both the Spirit, to confess.",
        "Praise we the Father and the Son\nAnd Holy Spirit, with them One;\nAnd may the Son on us bestow\nThe gifts that from the Spirit flow! Amen."
      ]
    },
    {
      "type": "versicle",
      "v": "O send forth thy Spirit and they shall be made.",
      "r": "And thou shalt renew the face of the earth."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O God, who as at this time didst teach the hearts of thy faithful people, by sending to them the light of thy Holy Spirit; Grant us by the same Spirit to have a right judgment in all things, and evermore to rejoice in his holy comfort. Through Christ our Lord. Amen."
    },
    {
      "type": "rubric",
      "text": "The Priest then sits, and the new convert kneels before him: who, touching the Holy Gospel with his right hand, utters the Profession of Faith as stated below; or, if he know not how to read, the Priest recites the same profession to him slowly, so that he can understand it when he turns and pronounce it with the priest in distinct words."
    },
    {
      "type": "heading",
      "text": "Profession of Faith"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "I N.N., having before my eyes the Holy Gospels, which I touch with my hand, and knowing that no one can be saved without that faith which the Holy, Catholic, and Apostolic Orthodox Church holds, believes, and teaches; against which I grieve that I have greatly erred, inasmuch as, I have held and believed doctrines opposed to her teaching.\nI now by the help of God’s grace, profess that I believe the Holy, Catholic Apostolic Orthodox Church to be the only and true Church established on earth by Jesus Christ, to which I submit myself with my whole heart. I firmly believe all the articles that she proposes to my belief; I reject and condemn all that she rejects and condemns, and I am ready to observe all that she commands me. And especially I profess that I believe:\nOne only God in three divine Persons, distinct from and equal to each other—that is to say, the Father, the Son, and the Holy Ghost;\nThe Catholic doctrine of the Incarnation, Passion, Death, and Resurrection of our Lord Jesus Christ; and the personal union of the two Natures, the divine and the human: the Divine Maternity of the most holy Mary together with her most spotless virginity;\nThe true, real, and substantial presence of the Body of our Lord Jesus Christ, together with his Soul and Divinity, in the most holy sacrament of the Eucharist;\nThe seven Sacraments instituted by Jesus Christ, for the salvation of mankind: that is to say, Baptism, Confirmation, Holy Eucharist, Penance, Holy Unction, Holy Orders, Matrimony;\nI also believe in the Resurrection of the Dead and Everlasting Life;\nThat Our Lord Jesus Christ is the Head of the Catholic Church; that no man can be the head of Christ's Body, that is to say, of the whole Church.\nThat the holy Apostles received from Our Lord equal spiritual power, and every bishop is equally successor of the Apostles.\nThe veneration of the Saints, and of their images;\nThe authority of the apostolic and ecclesiastical Traditions, and of the Holy Scriptures, which we must interpret and understand only in the sense which our holy Mother the Catholic Church has held, and does hold, to whom alone it belongs to judge of their meaning and interpretation.\nAnd everything else that has been defined and declared by the sacred Canons, by the Seven Holy Ecumenical Councils, and the other traditions of the Holy Orthodox Catholic Apostolic Church.\nWith a sincere heart, therefore, and with unfeigned faith, I detest and abjure every error, heresy, and sect opposed to the said Catholic, Apostolic, and Orthodox Church. So help me God, and these his holy Gospels, which I touch with my hand."
    },
    {
      "type": "rubric",
      "text": "The new convert then says Psalm 51, as follows (or Psalm 130)."
    },
    {
      "type": "inlineToggle",
      "toggle": "receptionPsalm",
      "options": [
        {
          "value": "51",
          "label": "Psalm 51"
        },
        {
          "value": "130",
          "label": "Psalm 130"
        }
      ]
    },
    {
      "type": "heading",
      "text": "Psalm 51. Miserere mei, Deus",
      "receptionPsalmOption": "51"
    },
    {
      "type": "canticle",
      "dropcap": true,
      "receptionPsalmOption": "51",
      "text": "Have mercy upon me, O God, after thy great goodness : according to the multitude of thy mercies do away mine offences.\nWash me throughly from my wickedness : and cleanse me from my sin.\nFor I acknowledge my faults : and my sin is ever before me.\nAgainst thee only have I sinned, and done this evil in thy sight : that thou mightest be justified in thy saying, and clear when thou art judged.\nBehold, I was shapen in wickedness : and in sin hath my mother conceived me.\nBut lo, thou requirest truth in the inward parts : and shalt make me to understand wisdom secretly.\nThou shalt purge me with hyssop, and I shall be clean : thou shalt wash me, and I shall be whiter than snow.\nThou shalt make me hear of joy and gladness : that the bones which thou hast broken may rejoice.\nTurn thy face from my sins : and put out all my misdeeds.\nMake me a clean heart, O God : and renew a right spirit within me.\nCast me not away from thy presence : and take not thy holy Spirit from me.\nO give me the comfort of thy help again : and stablish me with thy free Spirit.\nThen shall I teach thy ways unto the wicked : and sinners shall be converted unto thee.\nDeliver me from blood-guiltiness, O God, thou that art the God of my health : and my tongue shall sing of thy righteousness.\nThou shalt open my lips, O Lord : and my mouth shall shew thy praise.\nFor thou desirest no sacrifice, else would I give it thee : but thou delightest not in burnt-offerings.\nThe sacrifice of God is a troubled spirit : a broken and contrite heart, O God, shalt thou not despise.\nO be favourable and gracious unto Sion : build thou the walls of Jerusalem.\nThen shalt thou be pleased with the sacrifice of righteousness, with the burnt-offerings and oblations : then shall they offer young bullocks upon thine altar.\n℣. Glory be to the Father, and to the Son, and to the Holy Ghost.\n℟. As it was in the beginning, is now, and ever shall be, world without end. Amen."
    },
    {
      "type": "heading",
      "text": "Psalm 130. De profundis",
      "receptionPsalmOption": "130"
    },
    {
      "type": "canticle",
      "dropcap": true,
      "receptionPsalmOption": "130",
      "text": "Out of the deep have I called unto thee, O Lord : Lord, hear my voice.\nO let thine ears consider well : the voice of my complaint.\nIf thou, Lord, wilt be extreme to mark what is done amiss : O Lord, who may abide it?\nFor there is mercy with thee : therefore shalt thou be feared.\nI look for the Lord; my soul doth wait for him : in his word is my trust.\nMy soul fleeth unto the Lord : before the morning watch, I say, before the morning watch.\nO Israel, trust in the Lord, for with the Lord there is mercy : and with him is plenteous redemption.\nAnd he shall redeem Israel : from all his sins.\n℣. Glory be to the Father, and to the Son, and to the Holy Ghost.\n℟. As it was in the beginning, is now, and ever shall be, world without end. Amen."
    },
    {
      "type": "heading",
      "text": "Preces"
    },
    {
      "type": "versicle",
      "v": "Lord, have mercy upon us.",
      "r": "Christ, have mercy upon us."
    },
    {
      "type": "versicle",
      "v": "Lord, have mercy upon us."
    },
    {
      "type": "rubric",
      "text": "Our Father is said secretly until,"
    },
    {
      "type": "versicle",
      "v": "And lead us not into temptation;",
      "r": "But deliver us from evil."
    },
    {
      "type": "versicle",
      "v": "Save thy servant, O Lord.",
      "r": "My God, that putteth his trust in thee."
    },
    {
      "type": "versicle",
      "v": "O Lord, hear my prayer.",
      "r": "And let my cry come unto thee."
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "r": "And with thy spirit."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "O God, whose nature and property is ever to have mercy and to forgive: receive our humble petitions, so that this thy servant—being bound by the sentence of excommunication—may be loosed by the pitifulness of thy great mercy. Amen."
    },
    {
      "type": "rubric",
      "text": "A conditional baptism here follows, if it is to be conferred."
    },
    {
      "type": "heading",
      "text": "Absolution"
    },
    {
      "type": "rubric",
      "text": "The Priest immediately sits down, turns to the convert, and—covering his head with the stole—absolves him of heresy in the following manner."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "With Apostolic Authority, I, by such authority, absolve thee from the bond of excommunication, which thou hadst incurred, (In grave or light doubt as to whether the penitent incurred excommunication by the profession of heresy, the priest here inserts the word 'perchance'.) and I restore thee to the Sacred Sacraments of the Church, Communion, and the Unity of the Faithful, in the Name of the Father, and of the Son, ✠ and of the Holy Ghost. Amen."
    },
    {
      "type": "rubric",
      "text": "The Priest then enjoins some salutary penance upon the convert."
    },
    {
      "type": "heading",
      "text": "Te Deum laudamus"
    },
    {
      "type": "canticle",
      "dropcap": true,
      "text": "We praise thee, O God; we acknowledge thee to be the Lord.\nAll the earth doth worship thee, the Father everlasting.\nTo thee all Angels cry aloud; the Heavens, and all the Powers therein;\nTo thee Cherubim and Seraphim continually do cry,\nHoly, Holy, Holy, Lord God of Sabaoth;\nHeaven and earth are full of the Majesty of thy glory.\nThe glorious company of the Apostles praise thee.\nThe goodly fellowship of the Prophets praise thee.\nThe noble army of Martyrs praise thee.\nThe holy Church throughout all the world doth acknowledge thee;\nThe Father of an infinite Majesty;\nThine honourable, true and only Son;\nAlso the Holy Ghost the Comforter.\nThou art the King of Glory, O Christ.\nThou art the everlasting Son of the Father.\nWhen thou tookest upon thee to deliver man, thou didst not abhor the Virgin's womb.\nWhen thou hadst overcome the sharpness of death, thou didst open the Kingdom of Heaven to all believers.\nThou sittest at the right hand of God, in the glory of the Father.\nWe believe that thou shalt come to be our Judge."
    },
    {
      "type": "rubric",
      "text": "The following is said kneeling."
    },
    {
      "type": "canticle",
      "text": "We therefore pray thee, help thy servants, whom thou hast redeemed with thy precious blood.\nMake them to be numbered with thy Saints, in glory everlasting.\nO Lord, save thy people, and bless thine heritage.\nGovern them and lift them up for ever.\nDay by day we magnify thee;\nAnd we worship thy Name ever, world without end.\nVouchsafe, O Lord, to keep us this day without sin.\nO Lord, have mercy upon us, have mercy upon us.\nO Lord, let thy mercy lighten upon us, as our trust is in thee.\nO Lord, in thee have I trusted; let me never be confounded."
    },
    {
      "type": "heading",
      "text": "Conclusion"
    },
    {
      "type": "rubric",
      "text": "The Priest then stands and says,"
    },
    {
      "type": "versicle",
      "v": "Blessed art thou, O Lord, in the firmament of heaven.",
      "r": "And above all to be praised and glorified for ever."
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "r": "And with thy spirit."
    },
    {
      "type": "rubric",
      "text": "{{Let us pray.}}"
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "Almighty and everlasting God, who hast given unto us thy servants grace by the confession of a true faith to acknowledge the glory of the eternal Trinity, and in the power of the Divine Majesty to worship the Unity: We beseech thee; that thou wouldest keep us stedfast in this faith, and evermore defend us from all adversities. Who livest and reignest, one God, world without end. Amen."
    },
    {
      "type": "versicle",
      "v": "The Lord be with you.",
      "r": "And with thy spirit."
    },
    {
      "type": "versicle",
      "v": "Let us bless the Lord.",
      "r": "Thanks be to God."
    },
    {
      "type": "collect",
      "dropcap": true,
      "text": "The Blessing of Almighty God, the Father, ✠ the Son, and the Holy Ghost, descend upon you and remain with you always. Amen."
    }
  ]
};
