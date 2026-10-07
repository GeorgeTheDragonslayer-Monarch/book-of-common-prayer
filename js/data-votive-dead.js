window.VOTIVE_DEAD_TEMPLATE = {
  "title": "Masses for the Dead",
  "source": "Transcribed from pages/Votives/Votive.tex. Entirely English-only, no elcol pairs, \\paracol, or minipage apparatus anywhere in the file; one standalone \\ding{64} cross mark, in the nuptial blessing under Holy Matrimony ('sanctify and ✠ bless you'). Covers four distinct Votive Masses: Our Lady on Saturday (five seasonal forms - Advent, Epiphanytide, Septuagesimatide, Eastertide, Trinitytide - each with its own Introit/Collect/Epistle/Gradual-or-Alleluia/Gospel/Offertory/Secret/Communion/Postcommunion), the Mass of the Angels, the Mass at a wedding for Holy Matrimony (including the two nuptial-blessing prayers and the final ring-blessing formula, distinct from the Sacrament of Matrimony rite itself already built at data/matrimony.json), and Masses for the Dead (the Collect/Secret/Postcommunion for the day of death or burial - each with a further 3rd/7th/30th-day alternate - the anniversary of death, and daily Requiem Masses, which uniquely give three alternate Collects/Secrets/Postcommunions side by side per the rubric governing which to use). The source mixes two different ways of marking each Mass-part's label - explicit \\subsection{Introit} headings in the Angels/Matrimony/Requiem Masses, versus bare \\introit/\\collect/\\offertory/etc. macros with no subsection heading in Our Lady on Saturday - both of which print as the same bold section label in the finished book, so both are normalized here to the same 'heading' section type for consistency; this is a typographic-equivalence decision, not a content change. The Advent form of Our Lady on Saturday has its Collect, Secret, and Postcommunion each commented out in the source and replaced with a rubric directing to the Collects/Secrets/Postcommunions of St. Mary in Advent, the Advent Feria, and the Holy Ghost printed on other pages - only the active rubric is included, matching the site's established practice of following the source's own choice of what is currently active. Print-only page cross-references (to specific page numbers) are dropped as meaningless on this site; ordinal-number macros ('3rd', '7th', '30th', '1st', '2nd') are flattened to plain text. \\divineName{Lord} and \\textsc{Jesus} (typographic-only macros for the divine Name) are flattened to plain text, matching the site's established practice for \\textsc{} elsewhere. Added 8/29 (per Augustine's answer, Q10 of the release-audit list): a 'Third Collect, Secret & Postcommunion' block, sourced from pages/Propers/Seasonal.tex:52-58 ('Against the Persecutors of the Church') and :63-69 ('For the Chief Bishop'), with a manual toggle between the two (votiveThirdCollectOption/votiveThirdCollectChoice) - this is the ad libitum third Collect the Our Lady on Saturday rubrics above already reference but never supplied text for. Also added bvmSeasonOption flags to all five seasonal forms of Our Lady on Saturday, so the page shows only the one matching the current date (see pickBvmSaturdaySeason in app.js) rather than all five back to back. Task #201 (George's corrections doc: \"The different Votive Masses should be provided in different pages, accessible on different items under the Votive Masses drop-down in the menu.\"): this file was split out of the single combined data/votive.json (which held all four of pages/Votives/Votive.tex's own top-level \\section blocks - Our Lady on Saturday, Mass of the Angels, Holy Matrimony, and Masses for the Dead - concatenated one after another on one page) into its own separate template, one per source \\section, each now its own site page under a new \"Votive Masses\" nav dropdown. The old page-level \"Votive Masses\" heading and this section's own now-redundant repeat of its own title (previously plain `{\"type\": \"heading\"}` entries) are both dropped here, since the page's own <h2 class=\"office-title\"> already supplies the title - matching every other static-rite page's convention sitewide.",
  "sections": [
    {
      "type": "rubric",
      "text": "Instead of {{Gloria Patri}} is said the {{Rest eternal.}}"
    },
    {
      "type": "heading",
      "text": "On the Commemoration of all the Faithful Departed"
    },
    {
      "type": "rubric",
      "text": "On this day, Masses are said of All Souls' Day."
    },
    {
      "type": "rubric",
      "text": "For a departed Bishop or Priest, as well on the Day of burial as on the Anniversary, the first of the All Souls' Day Masses is said, with the special prayers in Various Prayers."
    },
    {
      "type": "heading",
      "text": "On the Day of Death or Burial of a Departed Person"
    },
    {
      "type": "rubric",
      "text": "The Mass is said of All Souls' Day's First Mass, except for the following."
    },
    {
      "type": "heading",
      "text": "Collect"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "O God, whose property is ever to have mercy and to forgive, we humbly entreat thee for the soul of thy servant N., which thou hast this day commanded to depart from this world: deliver it not into the hands of the enemy, neither forget it at the last, but command that it be received by thy holy Angels, and brought unto the fatherland of paradise; that forasmuch as he hoped and believed in thee, he may not undergo the pains of hell, but may obtain everlasting felicity. Through."
    },
    {
      "type": "rubric",
      "text": "On the 3rd, 7th, and 30th Day, the following Collect is instead said,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "We beseech thee, O Lord, that thou wouldest vouchsafe to grant unto the soul of thy servant N., whose burial three days since, we now commemorate, the fellowship of thy Saints and elect: and that thou wouldest pour upon it the continual dew of thy mercy. Through."
    },
    {
      "type": "heading",
      "text": "Epistle. 1 Thessalonians 4:13"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Brethren: I would not have you to be ignorant concerning them which are asleep, that ye sorrow not, even as others which have no hope. For if we believe that Jesus died and rose again: even so them also which sleep in Jesus will God bring with him. For this we say unto you by the word of the Lord, that we which are alive and remain unto the coming of the Lord shall not prevent them which are asleep. For the Lord himself shall descend from heaven with a shout, with the voice of the Archangel, and with the trump of God: and the dead in Christ shall rise first. Then we which are alive and remain shall be caught up together with them in the clouds, to meet the Lord in the air, and so shall we ever be with the Lord. Wherefore comfort one another with these words."
    },
    {
      "type": "heading",
      "text": "Gospel. John 11:21"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "At that time: Martha said unto Jesus: Lord, if thou hadst been here, my brother had not died: but I know, that even now, whatsoever thou wilt ask of God, God will give it thee. Jesus saith unto her: Thy brother shall rise again. Martha saith unto him: know that he shall rise again in the resurrection at the last day. Jesus said unto her: I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live: and whosoever liveth and believeth in me shall never die. Believest thou this? She saith unto him: Yea, Lord, I believe that thou art the Christ, the Son of God, which should come into the world."
    },
    {
      "type": "heading",
      "text": "Secret"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "We beseech thee, O Lord, to have mercy upon the soul of thy servant N., for which we offer unto thee the sacrifice of praise, humbly entreating thy majesty: that by these offices of loving atonement, it may be worthy to attain unto everlasting rest. Through."
    },
    {
      "type": "rubric",
      "text": "On the 3rd, 7th, and 30th Day, the following Secret is instead said,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "We beseech thee, O Lord, graciously to regard the gifts which we offer unto thee for the soul of thy servant N.: that, being cleansed by heavenly remedies, it may rest in thy mercy. Through."
    },
    {
      "type": "heading",
      "text": "Postcommunion"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Grant, we beseech thee, almighty God: that the soul of thy servant N., which hath this day passed from this world, being cleansed by these sacrifices and delivered from sins, may obtain thy pardon and everlasting rest. Through."
    },
    {
      "type": "rubric",
      "text": "On the 3rd, 7th, and 30th Day, the following Secret is instead said,"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Receive, O Lord, our prayers for the soul of thy servant N.: that whatsoever stains of earthly defilement cleave to it may by thy merciful pardon be done away. Through."
    },
    {
      "type": "heading",
      "text": "On the Anniversary of the Departed"
    },
    {
      "type": "rubric",
      "text": "All is said of All Souls' Day's Second Mass, except the following."
    },
    {
      "type": "heading",
      "text": "Collect"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "O God, the Lord of mercies: grant unto the soul of thy servant N., the anniversary of whose burial we now commemorate, a place of refreshment, the blessedness of rest, and the brightness of thy light. Through."
    },
    {
      "type": "heading",
      "text": "Secret"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Be favourable, O Lord, to our supplications for the soul of thy servant N., whose anniversary is kept this day: for which we offer unto thee this sacrifice of praise; that thou wouldest vouchsafe to join it to the fellowship of thy Saints. Through."
    },
    {
      "type": "heading",
      "text": "Postcommunion"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Grant, we beseech thee, O Lord: that the soul of thy servant N., the anniversary of whose burial we commemorate; being purged by these sacrifices, may obtain both pardon and everlasting rest. Through."
    },
    {
      "type": "heading",
      "text": "In Daily Masses of the Dead"
    },
    {
      "type": "rubric",
      "text": "All is said of All Souls' Day's Third Mass, except the following."
    },
    {
      "type": "heading",
      "text": "Collect"
    },
    {
      "type": "rubric",
      "text": "If the Mass is said for the all the faithful departed, then all three Collects are said."
    },
    {
      "type": "rubric",
      "text": "If the Mass is said for specified persons, the 1st Collect is for him (or say the second Collect following if the name is unknown), the 2nd Collect is {{ad libitum,}} & the 3rd Collect is the third Collect following."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "O God, who didst cause thy servants to enjoy the dignity of Priest or Bishop in the apostolic Priesthood: grant, we beseech thee; that they may evermore be joined unto the fellowship of the same. Through."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "O God, the giver of pardon and lover of man's salvation: we beseech thee of thy mercy to grant; that the brethren, kinsfolk, and benefactors of our congregation who have passed out of this world, may, at the intercession of blessed Mary ever Virgin and of all thy Saints, attain unto the fellowship of eternal blessedness. (Through.)"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "O God, the Creator and Redeemer of all the faithful: grant unto the souls of thy servants and handmaids the remission of all their sins; that through devout supplications they may obtain the pardon which they have alway desired. Who livest and reignest."
    },
    {
      "type": "heading",
      "text": "Secret"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Accept, O Lord, we beseech thee, the sacrifices which we offer to thee for the souls of thy servants, Bishops or Priests: that forasmuch as in this life thou didst bestow on them the dignity of Bishop or Priest, so thou wouldest bid them be joined unto the fellowship of thy Saints in the heavenly kingdom. Through."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "O God, whose mercies are without number, graciously receive our humble prayers: and through these sacraments of our salvation grant unto the souls of our brethren, kinsfolk, and benefactors, to whom thou hast given the confession of thy name, the remission of all their sins. (Through.)"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "We beseech thee, O Lord, look favourably upon the sacrifices which we offer unto thee for the souls of thy servants and handmaids: that as thou hast bestowed on them the merit of the Christian faith, thou wouldest grant them the reward of the same. Through."
    },
    {
      "type": "heading",
      "text": "Postcommunion"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "We beseech thee, O Lord, that thy merciful loving kindness, which we implore, may be profitable for the souls of thy servants, Bishops or Priests: that by thy mercy they may attain unto the eternal fellowship of him in whom they have hoped and believed. Through."
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "Grant, we beseech thee, almighty and merciful God: that the souls of our brethren, kinsfolk, and benefactors, for whom we have offered unto thy majesty this sacrifice of praise; may by the power of this sacrament be cleansed from all their sins, and by thy mercy obtain the blessedness of everlasting light. (Through.)"
    },
    {
      "type": "text",
      "dropcap": true,
      "text": "We beseech thee, O Lord, that the prayer of thy suppliant people may be profitable for the souls of thy servants and handmaids: that thou wouldest deliver them from all their sins, and make them to be partakers of thy redemption. Who livest."
    }
  ]
};
