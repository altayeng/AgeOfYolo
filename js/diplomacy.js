// diplomacy.js - Diplomacy system and faction relationships

// Diplomacy System
const diplomacySystem = {
    // Faction data
    factions: {
        'northern-tribe': {
            name: 'Mavi Krallığı', // Player's kingdom
            relation: 'self', // new relation type for player
            relationValue: 100, 
            icon: '🔵',
            tradeBenefit: 'wood',
            militaryStrength: 70,
            isPlayer: true // Mark as player kingdom
        },
        'eastern-empire': {
            name: 'Kırmızı Krallığı',
            relation: 'enemy',
            relationValue: 20,
            icon: '🔴',
            tradeBenefit: 'stone',
            militaryStrength: 90,
        },
        'western-kingdom': {
            name: 'Yeşil Krallığı',
            relation: 'enemy',
            relationValue: 25,
            icon: '🟢',
            tradeBenefit: 'food',
            militaryStrength: 60,
        },
        'southern-duchy': {
            name: 'Mor Krallığı',
            relation: 'enemy',
            relationValue: 30,
            icon: '🟣',
            tradeBenefit: 'gold',
            militaryStrength: 75,
        },
        'desert-caliphate': {
            name: 'Turuncu Krallığı',
            relation: 'enemy',
            relationValue: 15,
            icon: '🟠',
            tradeBenefit: 'food',
            militaryStrength: 80,
        }
    },
    
    // Active treaties and agreements
    treaties: [],
    
    // Dialog themes - used for more complex storytelling
    dialogThemes: {
        'border_dispute': {
            active: false,
            with: null,
            progress: 0,
            resolved: false
        },
        'resource_crisis': {
            active: false,
            with: null,
            progress: 0,
            resolved: false
        },
        'royal_marriage': {
            active: false,
            with: null,
            progress: 0,
            resolved: false
        },
        'ancient_relic': {
            active: false,
            with: null,
            progress: 0,
            resolved: false
        }
    },
    
    // AI dialog responses with both English and Turkish translations
    dialogResponses: {
        // Basic greetings
        'greeting': {
            'en': [
            "Greetings, noble ruler. What brings you to our lands?",
            "Well met. What diplomatic matters do you wish to discuss?",
            "Ah, the ruler of the neighboring kingdom. What is your purpose here?"
        ],
            'tr': [
                "Selamlar, asil hükümdar. Sizi topraklarımıza getiren nedir?",
                "Hoş geldiniz. Hangi diplomatik konuları görüşmek istersiniz?",
                "Ah, komşu krallığın hükümdarı. Buradaki amacınız nedir?"
            ]
        },
        'friendly': {
            'en': [
            "Our kingdoms have much to gain through cooperation!",
            "Your friendship is valued in these trying times.",
            "Our people speak highly of your rule. Let us continue our alliance."
        ],
            'tr': [
                "Krallıklarımızın işbirliği ile kazanacağı çok şey var!",
                "Bu zor zamanlarda dostluğunuz değerlidir.",
                "Halkımız yönetiminizden övgüyle bahsediyor. İttifakımızı sürdürelim."
            ]
        },
        'neutral': {
            'en': [
            "We remain cautious but open to negotiation.",
            "Your proposal has merit, but we must consider our own interests.",
            "Perhaps we can find common ground, though trust must be earned."
        ],
            'tr': [
                "Temkinli kalıyoruz ancak müzakereye açığız.",
                "Teklifinizin değeri var, ancak kendi çıkarlarımızı da düşünmeliyiz.",
                "Belki ortak bir nokta bulabiliriz, ancak güven kazanılması gerekir."
            ]
        },
        'hostile': {
            'en': [
            "Your presence is not welcome here. State your business quickly.",
            "We have little interest in your words after your previous actions.",
            "Tread carefully. Our armies stand ready should your intentions prove false."
        ],
            'tr': [
                "Varlığınız burada hoş karşılanmıyor. İşinizi hızlıca belirtin.",
                "Önceki eylemlerinizden sonra sözlerinize pek ilgi duymuyoruz.",
                "Dikkatli olun. Niyetleriniz sahte çıkarsa ordularımız hazır bekliyor."
            ]
        },
        'peace_accept': {
            'en': [
            "We accept your offer of peace. May this ceasefire bring prosperity to both our realms.",
            "Very well. The bloodshed between our peoples will cease... for now.",
            "Your gold will serve our kingdom well. We agree to this ceasefire."
        ],
            'tr': [
                "Barış teklifinizi kabul ediyoruz. Bu ateşkes her iki krallığımıza da refah getirsin.",
                "Pekala. Halklarımız arasındaki kan dökülmesi duracak... şimdilik.",
                "Altınınız krallığımıza iyi hizmet edecek. Bu ateşkesi kabul ediyoruz."
            ]
        },
        'peace_reject': {
            'en': [
            "Your gold does not interest us as much as your lands. We reject your offer.",
            "Peace? After what you've done? No amount of gold will heal these wounds.",
            "This offer insults us. Prepare your defenses, for we will continue our campaign."
            ],
            'tr': [
                "Altınınız bizi topraklarınız kadar ilgilendirmiyor. Teklifinizi reddediyoruz.",
                "Barış mı? Yaptıklarınızdan sonra? Hiçbir miktar altın bu yaraları iyileştiremez.",
                "Bu teklif bizi aşağılıyor. Savunmanızı hazırlayın, çünkü seferimize devam edeceğiz."
            ]
        },
        
        // New story-driven dialog options
        'border_dispute_intro': {
            'en': [
                "Our scouts report your people have been settling too close to our ancestral lands.",
                "There seems to be confusion about where your territory ends and ours begins.",
                "We've noticed increased activity at our shared border. This concerns us greatly."
            ],
            'tr': [
                "Keşifçilerimiz halkınızın atalarımızın topraklarına çok yakın yerleştiğini bildiriyor.",
                "Topraklarınızın nerede bittiği ve bizimkilerin nerede başladığı konusunda karışıklık var gibi.",
                "Ortak sınırımızda artan bir hareketlilik fark ettik. Bu bizi oldukça endişelendiriyor."
            ]
        },
        'border_dispute_escalate': {
            'en': [
                "Your continued encroachment cannot be tolerated. Remove your settlers or face consequences.",
                "We've fortified our border positions. Any further expansion will be met with force.",
                "This land has belonged to our people for generations. Your claims are baseless and provocative."
            ],
            'tr': [
                "Devam eden tecavüzünüze tahammül edilemez. Yerleşimcilerinizi kaldırın veya sonuçlarına katlanın.",
                "Sınır mevzilerimizi güçlendirdik. Herhangi bir genişleme güçle karşılanacaktır.",
                "Bu toprak nesillerdir halkımıza aittir. İddialarınız temelsiz ve kışkırtıcıdır."
            ]
        },
        'border_dispute_resolve': {
            'en': [
                "We propose a new border that respects both our ancestral claims. Will you agree to this map?",
                "Perhaps a shared zone between our kingdoms would benefit both our peoples.",
                "We are willing to cede some disputed areas in exchange for trade concessions."
            ],
            'tr': [
                "Her iki atalarımızın iddialarına saygı duyan yeni bir sınır öneriyoruz. Bu haritayı kabul eder misiniz?",
                "Belki de krallıklarımız arasında paylaşılan bir bölge her iki halkımıza da fayda sağlayacaktır.",
                "Bazı ihtilaflı alanları ticari imtiyazlar karşılığında devretmeye hazırız."
            ]
        },
        
        'resource_crisis_intro': {
            'en': [
                "Our kingdom faces a severe shortage of food after the harsh winter. We seek your aid.",
                "The recent drought has depleted our wood supplies. Our people suffer.",
                "Our mines have collapsed, cutting off our stone supply. We need assistance."
            ],
            'tr': [
                "Krallığımız sert kışın ardından ciddi bir yiyecek kıtlığıyla karşı karşıya. Yardımınızı arıyoruz.",
                "Son kuraklık odun kaynaklarımızı tüketti. Halkımız acı çekiyor.",
                "Madenlerimiz çöktü, taş tedarikimizi kesti. Yardıma ihtiyacımız var."
            ]
        },
        'resource_crisis_request': {
            'en': [
                "Would you spare 50 units of food to help us through this difficult time?",
                "We request 40 units of wood to rebuild our damaged structures.",
                "Could you provide 30 units of stone to help us repair our defenses?"
            ],
            'tr': [
                "Bu zor zamanı atlatmamıza yardımcı olmak için 50 birim yiyecek bağışlar mısınız?",
                "Hasar görmüş yapılarımızı yeniden inşa etmek için 40 birim odun talep ediyoruz.",
                "Savunmalarımızı onarmamıza yardımcı olmak için 30 birim taş sağlayabilir misiniz?"
            ]
        },
        'resource_crisis_grateful': {
            'en': [
                "Your generosity will not be forgotten. Our people will remember this kindness.",
                "You have saved many lives today. We are deeply in your debt.",
                "This aid strengthens the bond between our kingdoms. You have our gratitude."
            ],
            'tr': [
                "Cömertliğiniz unutulmayacak. Halkımız bu iyiliği hatırlayacaktır.",
                "Bugün birçok hayat kurtardınız. Size derinden borçluyuz.",
                "Bu yardım krallıklarımız arasındaki bağı güçlendiriyor. Minnettarız."
            ]
        },
        'resource_crisis_angry': {
            'en': [
                "You turn us away in our time of need? This betrayal will not be forgotten.",
                "So this is how you treat those who seek your help? Our people will know of this.",
                "Your refusal reveals the true nature of your kingdom. We will remember this."
            ],
            'tr': [
                "İhtiyaç zamanımızda bizi geri mi çeviriyorsunuz? Bu ihanet unutulmayacak.",
                "Demek yardım isteyenlere böyle davranıyorsunuz? Halkımız bunu bilecek.",
                "Reddiniz krallığınızın gerçek doğasını ortaya koyuyor. Bunu hatırlayacağız."
            ]
        },
        
        'trade_proposal': {
            'en': [
                "We offer favorable rates for your surplus resources. Would you be interested in regular trade?",
                "Our merchants have high demand for your goods. Shall we establish a trade route?",
                "A formal trade agreement would benefit both our kingdoms. What say you?"
            ],
            'tr': [
                "Fazla kaynaklarınız için uygun fiyatlar sunuyoruz. Düzenli ticarete ilgi duyar mısınız?",
                "Tüccarlarımız mallarınıza yüksek talep gösteriyor. Bir ticaret yolu kuralım mı?",
                "Resmi bir ticaret anlaşması her iki krallığımıza da fayda sağlayacaktır. Ne dersiniz?"
            ]
        },
        'trade_accept': {
            'en': [
                "We accept your trade proposal. May our merchants grow wealthy together.",
                "A wise decision. Our markets will welcome your goods with open arms.",
                "Let the caravans flow between our kingdoms! This marks a new era of prosperity."
            ],
            'tr': [
                "Ticaret teklifinizi kabul ediyoruz. Tüccarlarımız birlikte zenginleşsin.",
                "Akıllıca bir karar. Pazarlarımız mallarınızı açık kollarla karşılayacak.",
                "Kervanlar krallıklarımız arasında aksın! Bu, yeni bir refah çağını işaret ediyor."
            ]
        },
        'trade_reject': {
            'en': [
                "We find your terms unfavorable. Perhaps we can revisit this discussion later.",
                "Our needs have changed since we last spoke. We must decline for now.",
                "The council has decided against this arrangement. We seek better terms."
            ],
            'tr': [
                "Şartlarınızı uygun bulmuyoruz. Belki bu tartışmaya daha sonra geri dönebiliriz.",
                "En son konuştuğumuzdan beri ihtiyaçlarımız değişti. Şimdilik reddetmeliyiz.",
                "Konsey bu düzenlemeye karşı karar verdi. Daha iyi şartlar arıyoruz."
            ]
        },
        
        'ancient_relic_intro': {
            'en': [
                "Our scholars have discovered references to an ancient artifact of great power in lands between our kingdoms.",
                "Legends speak of a relic from the old gods, hidden somewhere in the disputed territories.",
                "We've uncovered texts describing a powerful artifact that could change the balance of power in this region."
            ],
            'tr': [
                "Bilginlerimiz, krallıklarımız arasındaki topraklarda büyük güce sahip antik bir esere atıflar keşfetti.",
                "Efsaneler, ihtilaflı bölgelerde bir yerde gizlenmiş eski tanrılardan kalma bir eserden bahsediyor.",
                "Bu bölgedeki güç dengesini değiştirebilecek güçlü bir eseri tanımlayan metinler ortaya çıkardık."
            ]
        },
        'ancient_relic_proposal': {
            'en': [
                "We propose a joint expedition to find this relic. We would share its power equally.",
                "Would you consider joining forces to recover this artifact, before others discover it?",
                "This relic could benefit both our kingdoms if we work together to recover it."
            ],
            'tr': [
                "Bu eseri bulmak için ortak bir sefer öneriyoruz. Gücünü eşit olarak paylaşacağız.",
                "Başkaları keşfetmeden önce bu eseri kurtarmak için güçlerimizi birleştirmeyi düşünür müsünüz?",
                "Bu eser, onu kurtarmak için birlikte çalışırsak her iki krallığımıza da fayda sağlayabilir."
            ]
        },
        'ancient_relic_betray': {
            'en': [
                "The relic is now in our possession, thanks to your assistance. However, we've decided it's too powerful to share.",
                "Our scholars have studied the relic and determined it must remain solely in our protection.",
                "The power of this artifact is too great. For the safety of all, we must keep it for ourselves."
            ],
            'tr': [
                "Eser, yardımınız sayesinde artık elimizde. Ancak, paylaşılamayacak kadar güçlü olduğuna karar verdik.",
                "Bilginlerimiz eseri inceledi ve yalnızca bizim korumamızda kalması gerektiğine karar verdi.",
                "Bu eserin gücü çok büyük. Herkesin güvenliği için onu kendimize saklamalıyız."
            ]
        },
        
        'royal_marriage_proposal': {
            'en': [
                "To strengthen the bonds between our kingdoms, we propose a royal marriage alliance.",
                "Our noble house offers the hand of our heir to cement our alliance through blood.",
                "A union of our royal families would ensure lasting peace for generations to come."
            ],
            'tr': [
                "Krallıklarımız arasındaki bağları güçlendirmek için kraliyet evliliği ittifakı öneriyoruz.",
                "Soylu hanemiz, ittifakımızı kan yoluyla sağlamlaştırmak için varisi elini sunuyor.",
                "Kraliyet ailelerimizin birleşmesi, gelecek nesiller için kalıcı barışı sağlayacaktır."
            ]
        },
        'royal_marriage_accept': {
            'en': [
                "We accept this union with joy. Let the wedding preparations begin!",
                "Our royal house is honored by this proposal. The marriage shall proceed.",
                "This alliance through marriage will bring a new era of prosperity to both our realms."
            ],
            'tr': [
                "Bu birliği sevinçle kabul ediyoruz. Düğün hazırlıkları başlasın!",
                "Kraliyet hanemiz bu teklifle onurlandırıldı. Evlilik devam edecek.",
                "Evlilik yoluyla bu ittifak, her iki krallığımıza da yeni bir refah çağı getirecek."
            ]
        },
        'royal_marriage_reject': {
            'en': [
                "While we value our relationship, we must decline this marriage proposal at this time.",
                "Our royal house is not currently in a position to entertain marriage alliances.",
                "We must respectfully decline. Other matters of succession prevent us from accepting."
            ],
            'tr': [
                "İlişkimize değer versek de, şu anda bu evlilik teklifini reddetmeliyiz.",
                "Kraliyet hanemiz şu anda evlilik ittifaklarını ağırlamak için uygun bir konumda değil.",
                "Saygıyla reddetmeliyiz. Diğer veraset meseleleri kabul etmemizi engelliyor."
            ]
        }
    },
    
    // Initialize diplomacy system
    init(resetToDefaults = false) {
        console.log("Initializing diplomacy system, resetToDefaults:", resetToDefaults);
        
        // Add CSS styles for relation bars
        if (!document.getElementById('diplomacy-relation-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'diplomacy-relation-styles';
            styleEl.textContent = `
                /* Relation bar styles */
                .relation-bar {
                    position: relative;
                    width: 100%;
                    height: 12px;
                    background-color: rgba(0, 0, 0, 0.3);
                    border-radius: 6px;
                    margin-top: 4px;
                    overflow: visible;
                }
                .relation-bar-fill {
                    position: absolute;
                    height: 100%;
                    left: 0;
                    top: 0;
                    background-color: #2196f3;
                    border-radius: 6px;
                    transition: width 0.3s ease, background-color 0.3s ease;
                }
                .relation-value {
                    position: absolute;
                    right: 4px;
                    top: -2px;
                    font-size: 0.8em;
                    color: white;
                    text-shadow: 0 0 3px rgba(0, 0, 0, 0.9);
                    font-weight: bold;
                }
                .faction-item {
                    display: flex;
                    padding: 10px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    align-items: center;
                }
                .faction-item:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
                .faction-details {
                    flex: 1;
                    margin-left: 10px;
                    margin-right: 10px;
                }
                .faction-name {
                    font-weight: bold;
                    margin-bottom: 2px;
                }
                .faction-relation {
                    font-size: 0.8em;
                    margin-bottom: 3px;
                }
                
                /* Hide reputation section */
                .reputation-section {
                    display: none;
                }
                
                /* Diplomatic relation colors */
                .diplomatic-ally {
                    color: #4caf50;
                }
                .diplomatic-neutral {
                    color: #2196f3;
                }
                .diplomatic-enemy {
                    color: #f44336;
                }
                .diplomatic-truce {
                    color: #ff9800;
                }
                
                /* Faction actions */
                .faction-actions {
                    display: flex;
                    align-items: center;
                }
                .faction-action {
                    background: none;
                    border: none;
                    color: white;
                    padding: 4px;
                    margin-left: 2px;
                    cursor: pointer;
                    opacity: 0.7;
                    transition: opacity 0.2s ease;
                }
                .faction-action:hover {
                    opacity: 1;
                }
                .faction-action:disabled {
                    opacity: 0.3;
                    cursor: not-allowed;
                }
                
                /* Treaty styles */
                .treaty-item {
                    display: flex;
                    padding: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                .treaty-icon {
                    font-size: 24px;
                    margin-right: 10px;
                }
                .treaty-details {
                    flex: 1;
                }
                .treaty-name {
                    font-weight: bold;
                }
                .treaty-parties, .treaty-duration {
                    font-size: 0.8em;
                    opacity: 0.8;
                }
                .empty-treaties {
                    padding: 10px;
                    text-align: center;
                    opacity: 0.6;
                }
                
                /* Dialog options */
                .dialog-option {
                    display: block;
                    width: 100%;
                    padding: 8px 12px;
                    margin-bottom: 6px;
                    background-color: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 4px;
                    color: white;
                    text-align: left;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                .dialog-option:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                
                /* Trade dialog styles */
                .trade-dialog {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 90%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                    background-color: #1e1e1e;
                    border: 2px solid #3498db;
                    border-radius: 8px;
                    z-index: 1000;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                    padding-bottom: 15px;
                }
                .trade-section {
                    display: flex;
                    flex-direction: column;
                    margin: 15px 0;
                }
                .trade-offer {
                    flex: 1;
                    padding: 10px;
                    background-color: rgba(0, 0, 0, 0.2);
                    border-radius: 6px;
                    margin-bottom: 10px;
                }
                .trade-arrow {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 10px 0;
                    font-size: 24px;
                }
                .amount-control {
                    display: flex;
                    align-items: center;
                }
                .amount-display {
                    min-width: 40px;
                    text-align: center;
                }
                .increase-button, .decrease-button {
                    background-color: rgba(255, 255, 255, 0.1);
                    border: none;
                    width: 28px;
                    height: 28px;
                    border-radius: 4px;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                }
                .increase-button:hover, .decrease-button:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                .resource-type {
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .trade-actions {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                    margin-top: 15px;
                    padding: 0 10px;
                    gap: 5px;
                }
                .trade-button {
                    padding: 8px 12px;
                    background-color: #2196f3;
                    border: none;
                    border-radius: 4px;
                    color: white;
                    cursor: pointer;
                    flex-grow: 1;
                    margin: 2px;
                }
                .trade-button.secondary {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                .trade-button:hover {
                    opacity: 0.9;
                }
                .trade-info {
                    background-color: rgba(52, 152, 219, 0.1);
                    padding: 8px;
                    border-radius: 4px;
                    margin: 10px 0;
                    border-left: 3px solid #3498db;
                }
                .trade-info h4 {
                    margin: 0 0 5px 0;
                    color: #3498db;
                    font-size: 14px;
                }
                .resource-values {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    font-size: 12px;
                }
                .resource-values span {
                    background-color: rgba(255, 255, 255, 0.1);
                    padding: 3px 6px;
                    border-radius: 3px;
                }
                .deal-evaluation {
                    text-align: center;
                    margin: 15px 0;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .deal-fair {
                    background-color: rgba(46, 204, 113, 0.2);
                    border: 1px solid #2ecc71;
                }
                .deal-unfair {
                    background-color: rgba(231, 76, 60, 0.2);
                    border: 1px solid #e74c3c;
                }
                .deal-neutral {
                    background-color: rgba(52, 152, 219, 0.2);
                    border: 1px solid #3498db;
                }
            `;
            document.head.appendChild(styleEl);
        }
        
        // If we need to reset to defaults, recreate the faction data
        if (resetToDefaults) {
            // Reset factions to defaults
            this.factions = {
                'northern-tribe': {
                    name: 'Mavi Krallığı', // Player's kingdom
                    relation: 'self',
                    relationValue: 100,
                    icon: '🔵',
                    tradeBenefit: 'wood',
                    militaryStrength: 70,
                    isPlayer: true
                },
                'eastern-empire': {
                    name: 'Kırmızı Krallığı',
                    relation: 'enemy',
                    relationValue: 20,
                    icon: '🔴',
                    tradeBenefit: 'stone',
                    militaryStrength: 90,
                },
                'western-kingdom': {
                    name: 'Yeşil Krallığı',
                    relation: 'enemy',
                    relationValue: 25,
                    icon: '🟢',
                    tradeBenefit: 'food',
                    militaryStrength: 60,
                },
                'southern-duchy': {
                    name: 'Mor Krallığı',
                    relation: 'enemy',
                    relationValue: 30,
                    icon: '🟣',
                    tradeBenefit: 'gold',
                    militaryStrength: 75,
                },
                'desert-caliphate': {
                    name: 'Turuncu Krallığı',
                    relation: 'enemy',
                    relationValue: 15,
                    icon: '🟠',
                    tradeBenefit: 'food',
                    militaryStrength: 80,
                }
            };
            
            // Reset treaties to defaults
            this.treaties = [];
            
            // Reset dialog themes
            this.dialogThemes = {
                'border_dispute': {
                    active: false,
                    with: null,
                    progress: 0,
                    resolved: false
                },
                'resource_crisis': {
                    active: false,
                    with: null,
                    progress: 0,
                    resolved: false
                },
                'royal_marriage': {
                    active: false,
                    with: null,
                    progress: 0,
                    resolved: false
                },
                'ancient_relic': {
                    active: false,
                    with: null,
                    progress: 0,
                    resolved: false
                }
            };
        }
        
        // Clear existing factions from previous versions
        const factionListEl = document.getElementById('faction-list');
        if (factionListEl) {
            factionListEl.innerHTML = '';
        }
        
        // Check if we need to update the HTML structure
        const reputationSection = document.querySelector('.reputation-section');
        if (reputationSection) {
            // Add faction relationship heading instead
            const diplomacyTitle = document.querySelector('.panel-title h3');
            if (diplomacyTitle) {
                diplomacyTitle.textContent = 'Krallık İlişkileri';
            }
        }
        
        // Set up event listeners for diplomacy UI
        const diplomacyButton = document.getElementById('diplomacy-button');
        const diplomacyPanel = document.getElementById('diplomacy-panel');
        const closeButton = document.getElementById('close-diplomacy');
        
        if (diplomacyButton) {
            // Open diplomacy panel - Remove any existing listeners first
            diplomacyButton.removeEventListener('click', this._openDiplomacyHandler);
            
            // Store handler for easier removal
            this._openDiplomacyHandler = () => {
                // Clear faction list to prevent duplicates
                const factionList = document.getElementById('faction-list');
                if (factionList) {
                    factionList.innerHTML = '';
                }
                
                if (diplomacyPanel) {
                    diplomacyPanel.classList.add('active');
                }
                this.syncKingdomsWithFactions();
                this.updateDiplomacyUI();
            };
            
            diplomacyButton.addEventListener('click', this._openDiplomacyHandler);
        }
        
        if (closeButton) {
            // Close diplomacy panel - Remove any existing listeners first
            closeButton.removeEventListener('click', this._closeDiplomacyHandler);
            
            // Store handler for easier removal
            this._closeDiplomacyHandler = () => {
                if (diplomacyPanel) {
                    diplomacyPanel.classList.remove('active');
                }
                this.closeDialog();
            };
            
            closeButton.addEventListener('click', this._closeDiplomacyHandler);
        }
        
        // Set up faction action buttons
        document.querySelectorAll('.faction-action').forEach(button => {
            // Remove existing listeners to avoid duplicates
            button.removeEventListener('click', this._factionActionHandler);
            
            // Store handler for easier removal
            this._factionActionHandler = (e) => {
                const action = e.target.closest('.faction-action').dataset.action;
                const factionId = e.target.closest('.faction-item').dataset.factionId;
                this.handleFactionAction(factionId, action);
                e.stopPropagation();
            };
            
            button.addEventListener('click', this._factionActionHandler);
        });
        
        // Create dialog container if it doesn't exist
        if (!document.getElementById('diplomacy-dialog')) {
            const dialogHTML = `
                <div id="diplomacy-dialog" class="diplomacy-dialog">
                    <div class="dialog-header">
                        <h3 id="dialog-faction-name">Kingdom Name</h3>
                        <button id="close-dialog" class="close-button">
                            <i class="material-icons-round">close</i>
                        </button>
                    </div>
                    <div class="dialog-content">
                        <div class="faction-portrait">
                            <div id="faction-icon" class="large-faction-icon">🏰</div>
                        </div>
                        <div class="dialog-message-container">
                            <p id="dialog-message" class="dialog-message">Selamlar, asil hükümdar. Sizi topraklarımıza getiren nedir?</p>
                        </div>
                        <div class="dialog-options" id="dialog-options">
                            <button class="dialog-option" data-option="ceasefire">Ateşkes Teklif Et (50 Altın)</button>
                            <button class="dialog-option" data-option="alliance">İttifak Öner</button>
                            <button class="dialog-option" data-option="trade">Ticareti Görüş</button>
                            <button class="dialog-option" data-option="close">Diyaloğu Bitir</button>
                        </div>
                    </div>
                </div>
            `;
            
            if (diplomacyPanel) {
                diplomacyPanel.insertAdjacentHTML('beforeend', dialogHTML);
            }
            
            // Add event listeners for dialog options
            const closeDialogButton = document.getElementById('close-dialog');
            if (closeDialogButton) {
                closeDialogButton.addEventListener('click', () => {
                    this.closeDialog();
                });
            }
            
            const dialogOptions = document.getElementById('dialog-options');
            if (dialogOptions) {
                dialogOptions.addEventListener('click', (e) => {
                    if (e.target.classList.contains('dialog-option')) {
                        const option = e.target.dataset.option;
                        const factionId = document.getElementById('diplomacy-dialog').dataset.factionId;
                        this.handleDialogOption(option, factionId);
                    }
                });
            }
        }
        
        // Sync with kingdoms data if available
        this.syncKingdomsWithFactions();
        
        // Update UI initially
        this.updateDiplomacyUI();
        
        console.log("Diplomacy system initialized");
        return true;
    },
    
    // Sync kingdoms from game state with factions
    syncKingdomsWithFactions() {
        // Skip if kingdoms aren't initialized yet
        if (!gameState.kingdoms || gameState.kingdoms.length === 0) return;
        
        // Create a mapping between kingdom IDs and faction IDs
        const kingdomMapping = {
            0: 'northern-tribe', // Kingdom 0 is player (Mavi Krallığı)
            1: 'eastern-empire', // Kingdom 1 maps to eastern-empire (Kırmızı Krallığı)
            2: 'western-kingdom', // Kingdom 2 maps to western-kingdom (Yeşil Krallığı)
            3: 'southern-duchy',  // Kingdom 3 maps to southern-duchy (Mor Krallığı)
            4: 'desert-caliphate' // Kingdom 4 maps to desert-caliphate (Turuncu Krallığı)
        };
        
        // Add all kingdoms to faction list, including player kingdom
        for (let i = 0; i < gameState.kingdoms.length; i++) {
            const kingdom = gameState.kingdoms[i];
            if (!kingdom) continue;
            
            // Check if this kingdom ID is in our mapping
            let factionId = kingdomMapping[i];
            
            // If not in mapping or the faction doesn't exist, create a new faction ID
            if (!factionId || !this.factions[factionId]) {
                factionId = `kingdom-${i}`;
                
                // Get color of the kingdom or use a default color
                const kingdomColor = kingdom.color || KINGDOM_COLORS[i % KINGDOM_COLORS.length] || '#ffd700';
                
                // Generate name based on color
                let kingdomName = this.getKingdomNameByColor(kingdomColor);
                
                // Player kingdom specific handling
                const isPlayerKingdom = (i === 0);
                
                // Add to factions
                this.factions[factionId] = {
                    name: kingdomName,
                    relation: isPlayerKingdom ? 'self' : 'enemy',
                    relationValue: isPlayerKingdom ? 100 : 30 + Math.floor(Math.random() * 20),
                    icon: this.getIconByColor(kingdomColor),
                    tradeBenefit: this.getRandomTradeBenefit(),
                    militaryStrength: 50 + Math.floor(Math.random() * 50),
                    color: kingdomColor,
                    isPlayer: isPlayerKingdom
                };
            }
            
            // Add to faction list in UI unless it's the player's kingdom
            if (!this.factions[factionId].isPlayer) {
                this.addFactionToUI(factionId);
            }
        }
    },
    
    // Get kingdom faction ID by kingdom ID
    getKingdomFactionId(kingdomId) {
        const kingdomMapping = {
            0: 'northern-tribe', // Player kingdom (Mavi Krallığı)
            1: 'eastern-empire', // Kırmızı Krallığı
            2: 'western-kingdom', // Yeşil Krallığı
            3: 'southern-duchy',  // Mor Krallığı
            4: 'desert-caliphate' // Turuncu Krallığı
        };
        
        // Return the faction name directly instead of faction ID
        if (kingdomMapping[kingdomId]) {
            if (kingdomId === 0) return 'Mavi Krallığı';
            if (kingdomId === 1) return 'Kırmızı Krallığı';
            if (kingdomId === 2) return 'Yeşil Krallığı';
            if (kingdomId === 3) return 'Mor Krallığı';
            if (kingdomId === 4) return 'Turuncu Krallığı';
        }
        
        return `Krallık ${kingdomId}`;
    },
    
    // Get kingdom name based on color
    getKingdomNameByColor(color) {
        // Convert color to lowercase for comparison
        const colorLower = color.toLowerCase();
        
        if (colorLower.includes('2962ff') || colorLower === '#2962ff' || colorLower === 'blue') {
            return 'Mavi Krallığı';
        } else if (colorLower.includes('d32f2f') || colorLower === '#d32f2f' || colorLower === 'red') {
            return 'Kırmızı Krallığı';
        } else if (colorLower.includes('388e3c') || colorLower === '#388e3c' || colorLower === 'green') {
            return 'Yeşil Krallığı';
        } else if (colorLower.includes('7b1fa2') || colorLower === '#7b1fa2' || colorLower === 'purple') {
            return 'Mor Krallığı';
        } else if (colorLower.includes('ff6f00') || colorLower === '#ff6f00' || colorLower === 'orange') {
            return 'Turuncu Krallığı';
        } else if (colorLower.includes('ffd700') || colorLower === '#ffd700' || colorLower === 'yellow') {
            return 'Sarı Krallığı';
        } else {
            // Default name if color doesn't match
            return `Krallık ${Math.floor(Math.random() * 1000)}`;
        }
    },
    
    // Get icon based on color
    getIconByColor(color) {
        const colorLower = color.toLowerCase();
        
        if (colorLower.includes('2962ff') || colorLower === '#2962ff' || colorLower === 'blue') {
            return '🔵';
        } else if (colorLower.includes('d32f2f') || colorLower === '#d32f2f' || colorLower === 'red') {
            return '🔴';
        } else if (colorLower.includes('388e3c') || colorLower === '#388e3c' || colorLower === 'green') {
            return '🟢';
        } else if (colorLower.includes('7b1fa2') || colorLower === '#7b1fa2' || colorLower === 'purple') {
            return '🟣';
        } else if (colorLower.includes('ff6f00') || colorLower === '#ff6f00' || colorLower === 'orange') {
            return '🟠';
        } else if (colorLower.includes('ffd700') || colorLower === '#ffd700' || colorLower === 'yellow') {
            return '🟡';
        } else {
            return '🏰';
        }
    },
    
    // Get random trade benefit
    getRandomTradeBenefit() {
        const benefits = ['wood', 'stone', 'food'];
        return benefits[Math.floor(Math.random() * benefits.length)];
    },
    
    // Add a faction to the UI
    addFactionToUI(factionId) {
        const faction = this.factions[factionId];
        if (!faction || faction.isPlayer) return; // Skip player's own kingdom
        
        const factionList = document.getElementById('faction-list');
        if (!factionList) return;
        
        // Check if faction already exists in UI
        if (document.querySelector(`.faction-item[data-faction-id="${factionId}"]`)) {
            return;
        }
        
        const factionHTML = `
            <div class="faction-item" data-faction-id="${factionId}">
                <div class="faction-icon">${faction.icon}</div>
                <div class="faction-details">
                    <div class="faction-name">${faction.name}</div>
                    <div class="faction-relation diplomatic-${faction.relation}">${window.translate ? window.translate(this.capitalizeFirstLetter(faction.relation)) : this.capitalizeFirstLetter(faction.relation)}</div>
                    <div class="relation-bar">
                        <div class="relation-bar-fill" style="width: ${faction.relationValue}%;"></div>
                        <div class="relation-value">${faction.relationValue}</div>
                    </div>
                </div>
                <div class="faction-actions">
                    <button class="faction-action" data-action="dialog">
                        <i class="material-icons-round">chat</i>
                    </button>
                    <button class="faction-action" data-action="trade">
                        <i class="material-icons-round">swap_horiz</i>
                    </button>
                    <button class="faction-action" data-action="alliance">
                        <i class="material-icons-round">handshake</i>
                    </button>
                    <button class="faction-action" data-action="war">
                        <i class="material-icons-round">gavel</i>
                    </button>
                </div>
            </div>
        `;
        
        factionList.insertAdjacentHTML('beforeend', factionHTML);
        
        // Add event listeners for this faction's buttons
        const newFactionItem = document.querySelector(`.faction-item[data-faction-id="${factionId}"]`);
        newFactionItem.querySelectorAll('.faction-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('.faction-action').dataset.action;
                this.handleFactionAction(factionId, action);
                e.stopPropagation();
            });
        });
    },
    
    // Update diplomacy UI elements
    updateDiplomacyUI() {
        // Don't update reputation since we're using individual relations instead
        
        // Update faction statuses
        Object.entries(this.factions).forEach(([factionId, faction]) => {
            // Skip player's own kingdom
            if (faction.isPlayer) return;
            
            let factionElement = document.querySelector(`.faction-item[data-faction-id="${factionId}"]`);
            
            // If faction element doesn't exist, create it
            if (!factionElement) {
                this.addFactionToUI(factionId);
                factionElement = document.querySelector(`.faction-item[data-faction-id="${factionId}"]`);
            }
            
            if (factionElement) {
                // Update relation display
                const relationElement = factionElement.querySelector('.faction-relation');
                relationElement.textContent = window.translate ? window.translate(this.capitalizeFirstLetter(faction.relation)) : this.capitalizeFirstLetter(faction.relation);
                relationElement.className = 'faction-relation'; // Reset classes
                relationElement.classList.add(`diplomatic-${faction.relation}`);
                
                // Add relation value to display
                const relationValueEl = factionElement.querySelector('.relation-value');
                if (relationValueEl) {
                    relationValueEl.textContent = faction.relationValue;
                    
                    // Update the relation bar
                    const relationBarEl = factionElement.querySelector('.relation-bar-fill');
                    if (relationBarEl) {
                        relationBarEl.style.width = `${faction.relationValue}%`;
                        
                        // Update color based on relation value
                        if (faction.relationValue >= 75) {
                            relationBarEl.style.backgroundColor = '#4caf50'; // Green for good relations
                        } else if (faction.relationValue >= 50) {
                            relationBarEl.style.backgroundColor = '#2196f3'; // Blue for decent relations
                        } else if (faction.relationValue >= 25) {
                            relationBarEl.style.backgroundColor = '#ff9800'; // Orange for poor relations
                        } else {
                            relationBarEl.style.backgroundColor = '#f44336'; // Red for bad relations
                        }
                    }
                }
                
                // Update buttons based on current relation
                const dialogButton = factionElement.querySelector('[data-action="dialog"]');
                const tradeButton = factionElement.querySelector('[data-action="trade"]');
                const allianceButton = factionElement.querySelector('[data-action="alliance"]');
                const warButton = factionElement.querySelector('[data-action="war"]');
                
                // Dialog is always enabled
                if (dialogButton) dialogButton.disabled = false;
                
                // Disable/enable buttons based on relation
                if (faction.relation === 'ally') {
                    tradeButton.disabled = false;
                    allianceButton.disabled = true;
                    warButton.disabled = false;
                } else if (faction.relation === 'enemy') {
                    tradeButton.disabled = true;
                    allianceButton.disabled = true;
                    warButton.disabled = false; // Can still declare war for renewing
                } else {
                    tradeButton.disabled = false;
                    allianceButton.disabled = false;
                    warButton.disabled = false;
                }
            }
        });
        
        // Update treaties list
        this.updateTreatiesList();
    },
    
    // Update treaties list in UI
    updateTreatiesList() {
        const treatyList = document.getElementById('treaty-list');
        if (!treatyList) return;
        
        // Clear existing entries
        treatyList.innerHTML = '';
        
        // Add each treaty to the list
        this.treaties.forEach(treaty => {
            // Format the parties involved
            const partiesText = treaty.parties.map(party => {
                if (party === 'player') return window.translate ? window.translate('You') : 'You';
                return this.factions[party]?.name || party;
            }).join(' & ');
            
            // Create treaty item
            const treatyHTML = `
                <div class="treaty-item" data-treaty-id="${treaty.id}">
                    <div class="treaty-icon">${treaty.icon || '📜'}</div>
                    <div class="treaty-details">
                        <div class="treaty-name">${treaty.name}</div>
                        <div class="treaty-parties">${partiesText}</div>
                        <div class="treaty-duration">${treaty.duration} ${window.translate ? window.translate('years remaining') : 'years remaining'}</div>
                    </div>
                </div>
            `;
            
            treatyList.insertAdjacentHTML('beforeend', treatyHTML);
        });
    },
    
    // Handle faction action (trade, alliance, war)
    handleFactionAction(factionId, action) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Implement action based on type
        switch (action) {
            case 'dialog':
                this.openDialog(factionId);
                break;
                
            case 'trade':
                if (faction.relation !== 'enemy') {
                    this.proposeTrade(factionId);
                }
                break;
                
            case 'alliance':
                if (faction.relation === 'neutral' || faction.relation === 'truce') {
                    this.proposeAlliance(factionId);
                }
                break;
                
            case 'war':
                if (faction.relation !== 'enemy') {
                    this.declareWar(factionId);
                }
                break;
        }
        
        // Update UI after action
        this.updateDiplomacyUI();
    },
    
    // Open dialog with faction
    openDialog(factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        const dialogEl = document.getElementById('diplomacy-dialog');
        const dialogFactionName = document.getElementById('dialog-faction-name');
        const dialogMessage = document.getElementById('dialog-message');
        const factionIcon = document.getElementById('faction-icon');
        const dialogOptions = document.getElementById('dialog-options');
        
        // Set current faction for the dialog
        dialogEl.dataset.factionId = factionId;
        
        // Update dialog content
        dialogFactionName.textContent = faction.name;
        factionIcon.textContent = faction.icon;
        
        // Get appropriate greeting based on relationship
        let responseType = 'greeting';
        if (faction.relation === 'ally') responseType = 'friendly';
        else if (faction.relation === 'enemy') responseType = 'hostile';
        else responseType = 'neutral';
        
        // Always use Turkish for dialogs (per requirement)
        const lang = 'tr';
        
        // Check for active storytelling theme for this faction
        let storyDialogUsed = false;
        for (const themeKey in this.dialogThemes) {
            const theme = this.dialogThemes[themeKey];
            if (theme.active && theme.with === factionId && !theme.resolved) {
                // Use the theme's dialog based on progress
                let themeResponseKey = `${themeKey}_intro`;
                
                if (theme.progress === 1) {
                    // Different response based on theme type
                    switch(themeKey) {
                        case 'border_dispute':
                            themeResponseKey = 'border_dispute_escalate';
                            break;
                        case 'resource_crisis':
                            themeResponseKey = 'resource_crisis_request';
                            break;
                        case 'ancient_relic':
                            themeResponseKey = 'ancient_relic_proposal';
                            break;
                        case 'royal_marriage':
                            themeResponseKey = 'royal_marriage_proposal';
                            break;
                    }
                } else if (theme.progress >= 2) {
                    // For advanced progress, customize by theme
                    switch(themeKey) {
                        case 'border_dispute':
                            themeResponseKey = 'border_dispute_resolve';
                            break;
                        case 'ancient_relic':
                            themeResponseKey = Math.random() < 0.3 ? 'ancient_relic_betray' : responseType;
                            break;
                        default:
                            // Default back to relation-based response
                            themeResponseKey = responseType;
                            break;
                    }
                }
                
                // Check if we have dialog for this theme state
                if (this.dialogResponses[themeResponseKey] && this.dialogResponses[themeResponseKey][lang]) {
                    const themeResponses = this.dialogResponses[themeResponseKey][lang];
                    dialogMessage.textContent = themeResponses[Math.floor(Math.random() * themeResponses.length)];
                    storyDialogUsed = true;
                    
                    // Add theme-specific options
                    this.addThemeDialogOptions(dialogOptions, themeKey, theme.progress, factionId);
                }
                
                break;
            }
        }
        
        // If no story dialog was used, use standard relation-based dialog
        if (!storyDialogUsed) {
            // Get random response from Turkish language
            const responses = this.dialogResponses[responseType][lang];
            if (responses && responses.length > 0) {
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                dialogMessage.textContent = randomResponse;
            } else {
                // Fallback to English if translation is missing
                const fallbackResponses = this.dialogResponses[responseType]['en'];
                dialogMessage.textContent = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
            }
        
            // Update dialog options based on relationship
            dialogOptions.innerHTML = '';
        
            // Standard dialog options
            this.addStandardDialogOptions(dialogOptions, faction);
        }
        
        // Show dialog
        dialogEl.style.display = 'block';
    },
    
    // Add standard dialog options based on faction relationship
    addStandardDialogOptions(dialogOptionsEl, faction) {
        // Always add close option
        const closeOption = document.createElement('button');
        closeOption.className = 'dialog-option';
        closeOption.dataset.option = 'close';
        closeOption.textContent = translate('Diyaloğu Bitir'); 
        
        // Add specific options based on relation
        if (faction.relation === 'enemy') {
            // Only enemies can be offered ceasefire
            const ceasefire = document.createElement('button');
            ceasefire.className = 'dialog-option';
            ceasefire.dataset.option = 'ceasefire';
            ceasefire.textContent = translate('Ateşkes Teklif Et (50 Altın)');
            dialogOptionsEl.appendChild(ceasefire);
            
            // Add option to bribe
            const bribe = document.createElement('button');
            bribe.className = 'dialog-option';
            bribe.dataset.option = 'bribe';
            bribe.textContent = translate('Yetkililere Rüşvet Ver (75 Altın)');
            dialogOptionsEl.appendChild(bribe);
            
        } else if (faction.relation === 'neutral' || faction.relation === 'truce') {
            // Neutral factions can be traded with or offered alliance
            const trade = document.createElement('button');
            trade.className = 'dialog-option';
            trade.dataset.option = 'trade';
            trade.textContent = translate('Ticareti Görüş');
            
            const alliance = document.createElement('button');
            alliance.className = 'dialog-option';
            alliance.dataset.option = 'alliance';
            alliance.textContent = translate('İttifak Öner');
            
            const gift = document.createElement('button');
            gift.className = 'dialog-option';
            gift.dataset.option = 'gift';
            gift.textContent = translate('Hediye Gönder (30 Altın)');
            
            const nonAggression = document.createElement('button');
            nonAggression.className = 'dialog-option';
            nonAggression.dataset.option = 'non_aggression';
            nonAggression.textContent = translate('Saldırmazlık Paktı Öner');
            
            dialogOptionsEl.appendChild(trade);
            dialogOptionsEl.appendChild(alliance);
            dialogOptionsEl.appendChild(gift);
            dialogOptionsEl.appendChild(nonAggression);
            
        } else if (faction.relation === 'ally') {
            // Allied factions can be traded with or requested for assistance
            const trade = document.createElement('button');
            trade.className = 'dialog-option';
            trade.dataset.option = 'trade';
            trade.textContent = translate('Ticareti Görüş');
            
            const assistance = document.createElement('button');
            assistance.className = 'dialog-option';
            assistance.dataset.option = 'assistance';
            assistance.textContent = translate('Askeri Yardım İste');
            
            const marriage = document.createElement('button');
            marriage.className = 'dialog-option';
            marriage.dataset.option = 'marriage';
            marriage.textContent = translate('Kraliyet Evliliği Öner');
            
            dialogOptionsEl.appendChild(trade);
            dialogOptionsEl.appendChild(assistance);
            dialogOptionsEl.appendChild(marriage);
        }
        
        // Add close option as the last option
        dialogOptionsEl.appendChild(closeOption);
    },
    
    // Add theme-specific dialog options
    addThemeDialogOptions(dialogOptionsEl, themeKey, progress, factionId) {
        // Clear existing options
        dialogOptionsEl.innerHTML = '';
        
        // Options depend on the theme and progress
        switch(themeKey) {
            case 'border_dispute':
                if (progress === 0) {
                    // Initial border dispute
                    const discussButton = document.createElement('button');
                    discussButton.className = 'dialog-option';
                    discussButton.dataset.option = 'border_discuss';
                    discussButton.textContent = translate('Sınır Sorunlarını Tartış');
                    dialogOptionsEl.appendChild(discussButton);
                    
                    const dismissButton = document.createElement('button');
                    dismissButton.className = 'dialog-option';
                    dismissButton.dataset.option = 'border_dismiss';
                    dismissButton.textContent = translate('İddialarını Reddet');
                    dialogOptionsEl.appendChild(dismissButton);
                } else if (progress === 1) {
                    // Escalated dispute
                    const cedeButton = document.createElement('button');
                    cedeButton.className = 'dialog-option';
                    cedeButton.dataset.option = 'border_cede';
                    cedeButton.textContent = translate('İhtilaflı Bölgeyi Terk Et');
                    dialogOptionsEl.appendChild(cedeButton);
                    
                    const defyButton = document.createElement('button');
                    defyButton.className = 'dialog-option';
                    defyButton.dataset.option = 'border_defy';
                    defyButton.textContent = translate('Taleplerini Reddet');
                    dialogOptionsEl.appendChild(defyButton);
                } else if (progress === 2) {
                    // Resolution phase
                    const acceptButton = document.createElement('button');
                    acceptButton.className = 'dialog-option';
                    acceptButton.dataset.option = 'border_accept';
                    acceptButton.textContent = translate('Uzlaşmayı Kabul Et');
                    dialogOptionsEl.appendChild(acceptButton);
                    
                    const rejectButton = document.createElement('button');
                    rejectButton.className = 'dialog-option';
                    rejectButton.dataset.option = 'border_reject';
                    rejectButton.textContent = translate('Uzlaşmayı Reddet');
                    dialogOptionsEl.appendChild(rejectButton);
                }
                break;
                
            case 'resource_crisis':
                if (progress === 1) {
                    // They're requesting resources
                    const helpButton = document.createElement('button');
                    helpButton.className = 'dialog-option';
                    helpButton.dataset.option = 'crisis_help';
                    helpButton.textContent = translate('Yardım Sağla');
                    dialogOptionsEl.appendChild(helpButton);
                    
                    const refuseButton = document.createElement('button');
                    refuseButton.className = 'dialog-option';
                    refuseButton.dataset.option = 'crisis_refuse';
                    refuseButton.textContent = translate('Yardımı Reddet');
                    dialogOptionsEl.appendChild(refuseButton);
                }
                break;
                
            case 'ancient_relic':
                if (progress === 1) {
                    // Joint expedition proposal
                    const joinButton = document.createElement('button');
                    joinButton.className = 'dialog-option';
                    joinButton.dataset.option = 'relic_join';
                    joinButton.textContent = translate('Sefere Katıl');
                    dialogOptionsEl.appendChild(joinButton);
                    
                    const declineButton = document.createElement('button');
                    declineButton.className = 'dialog-option';
                    declineButton.dataset.option = 'relic_decline';
                    declineButton.textContent = translate('Seferi Reddet');
                    dialogOptionsEl.appendChild(declineButton);
                } else if (progress === 2) {
                    // They've betrayed you
                    const attackButton = document.createElement('button');
                    attackButton.className = 'dialog-option';
                    attackButton.dataset.option = 'relic_attack';
                    attackButton.textContent = translate('Savaş İlan Et');
                    dialogOptionsEl.appendChild(attackButton);
                    
                    const acceptButton = document.createElement('button');
                    acceptButton.className = 'dialog-option';
                    acceptButton.dataset.option = 'relic_accept';
                    acceptButton.textContent = translate('İhaneti Kabul Et');
                    dialogOptionsEl.appendChild(acceptButton);
                }
                break;
                
            case 'royal_marriage':
                if (progress === 1) {
                    // Marriage proposal
                    const acceptButton = document.createElement('button');
                    acceptButton.className = 'dialog-option';
                    acceptButton.dataset.option = 'marriage_accept';
                    acceptButton.textContent = translate('Evliliği Kabul Et');
                    dialogOptionsEl.appendChild(acceptButton);
                    
                    const rejectButton = document.createElement('button');
                    rejectButton.className = 'dialog-option';
                    rejectButton.dataset.option = 'marriage_reject';
                    rejectButton.textContent = translate('Evliliği Reddet');
                    dialogOptionsEl.appendChild(rejectButton);
                }
                break;
        }
        
        // Always add close option
        const closeOption = document.createElement('button');
        closeOption.className = 'dialog-option';
        closeOption.dataset.option = 'close';
        closeOption.textContent = translate('Diyaloğu Bitir');
        dialogOptionsEl.appendChild(closeOption);
    },
    
    // Close dialog
    closeDialog() {
        const dialogEl = document.getElementById('diplomacy-dialog');
        if (dialogEl) {
            dialogEl.style.display = 'none';
        }
    },
    
    // Handle dialog option
    handleDialogOption(option, factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Always use Turkish for dialog messages
        const lang = 'tr';
        const dialogMessage = document.getElementById('dialog-message');
        
        // Standard dialog options
        switch (option) {
            case 'ceasefire':
                this.offerCeasefire(factionId);
                break;
                
            case 'trade':
                this.proposeTrade(factionId);
                this.closeDialog();
                break;
                
            case 'alliance':
                this.proposeAlliance(factionId);
                this.closeDialog();
                break;
                
            case 'non_aggression':
                this.proposeNonAggression(factionId);
                this.closeDialog();
                break;
                
            case 'assistance':
                // Find an enemy kingdom to target
                let targetKingdomId = null;
                for (let i = 1; i < gameState.kingdoms.length; i++) {
                    const kingdomFactionId = this.getKingdomFactionId(i);
                    if (kingdomFactionId && this.factions[kingdomFactionId] && 
                        this.factions[kingdomFactionId].relation === 'enemy') {
                        targetKingdomId = i;
                        break;
                    }
                }
                
                if (targetKingdomId) {
                    this.requestMilitaryAssistance(factionId, targetKingdomId);
                } else {
                    showGameMessage(translate("Saldırılacak düşman krallık bulunamadı"));
                }
                this.closeDialog();
                break;
                
            case 'gift':
                this.sendDiplomaticGift(factionId);
                this.closeDialog();
                break;
                
            case 'bribe':
                this.bribeOfficials(factionId);
                this.closeDialog();
                break;
                
            case 'marriage':
                // Initiate royal marriage storyline
                this.initiateStoryline('royal_marriage', factionId);
                this.closeDialog();
                break;
                
            case 'close':
                this.closeDialog();
                break;
                
            // Border dispute storyline options
            case 'border_discuss':
                this.handleBorderDispute(factionId, 'discuss');
                break;
                
            case 'border_dismiss':
                this.handleBorderDispute(factionId, 'dismiss');
                break;
                
            case 'border_cede':
                this.handleBorderDispute(factionId, 'cede');
                break;
                
            case 'border_defy':
                this.handleBorderDispute(factionId, 'defy');
                break;
                
            case 'border_accept':
                this.handleBorderDispute(factionId, 'accept');
                break;
                
            case 'border_reject':
                this.handleBorderDispute(factionId, 'reject');
                break;
                
            // Resource crisis storyline options
            case 'crisis_help':
                this.handleResourceCrisis(factionId, 'help');
                break;
                
            case 'crisis_refuse':
                this.handleResourceCrisis(factionId, 'refuse');
                break;
                
            // Ancient relic storyline options
            case 'relic_join':
                this.handleAncientRelic(factionId, 'join');
                break;
                
            case 'relic_decline':
                this.handleAncientRelic(factionId, 'decline');
                break;
                
            case 'relic_attack':
                this.handleAncientRelic(factionId, 'attack');
                break;
                
            case 'relic_accept':
                this.handleAncientRelic(factionId, 'accept');
                break;
                
            // Royal marriage storyline options
            case 'marriage_accept':
                this.handleRoyalMarriage(factionId, 'accept');
                break;
                
            case 'marriage_reject':
                this.handleRoyalMarriage(factionId, 'reject');
                break;
        }
    },
    
    // Initiate a storyline with a faction
    initiateStoryline(themeKey, factionId) {
        // Don't initiate if already active with any faction
        for (const key in this.dialogThemes) {
            if (this.dialogThemes[key].active) {
                return false;
            }
        }
        
        // Set theme as active with this faction
        this.dialogThemes[themeKey] = {
            active: true,
            with: factionId,
            progress: 0,
            resolved: false
        };
        
        // Show notification about new storyline
        let message = "";
        switch(themeKey) {
            case 'border_dispute':
                message = translate("Border tensions have risen with") + " " + this.factions[factionId].name;
                break;
            case 'resource_crisis':
                message = this.factions[factionId].name + " " + translate("faces a severe resource shortage");
                break;
            case 'ancient_relic':
                message = translate("Rumors of an ancient relic have surfaced");
                break;
            case 'royal_marriage':
                message = translate("A royal union is being discussed with") + " " + this.factions[factionId].name;
                break;
        }
        
        showGameMessage(message);
        return true;
    },
    
    // Handle border dispute storyline
    handleBorderDispute(factionId, action) {
        const theme = this.dialogThemes.border_dispute;
        const dialogMessage = document.getElementById('dialog-message');
        const dialogOptions = document.getElementById('dialog-options');
        const lang = currentLanguage === LANGUAGES.TR ? 'tr' : 'en';
        
        if (theme.progress === 0) {
            if (action === 'discuss') {
                // Player chooses to discuss, relationship improves slightly
                this.changeFactionRelation(factionId, 5);
                dialogMessage.textContent = translate("We appreciate your willingness to discuss this matter. Let us work towards a resolution.");
                theme.progress = 1;
                
                // Update UI to reflect progress
                this.addThemeDialogOptions(dialogOptions, 'border_dispute', theme.progress, factionId);
            } else if (action === 'dismiss') {
                // Player dismisses claims, relationship worsens
                this.changeFactionRelation(factionId, -10);
                dialogMessage.textContent = translate("Your dismissal of our rightful claims will not be forgotten. This matter is not concluded.");
                theme.progress = 1;
                
                // Update UI with more hostile options
                this.addThemeDialogOptions(dialogOptions, 'border_dispute', theme.progress, factionId);
            }
        } else if (theme.progress === 1) {
            if (action === 'cede') {
                // Player cedes territory, relationship improves but resource penalty
                this.changeFactionRelation(factionId, 15);
                
                // Resource penalty for ceding territory
                if (gameState.resources) {
                    gameState.resources.wood -= 20;
                    gameState.resources.stone -= 15;
                    updateResourceUI();
                }
                
                dialogMessage.textContent = translate("Your wisdom in this matter is commendable. We accept this resolution.");
                theme.progress = 2;
                theme.resolved = true;
                
                // Show resolution message
                setTimeout(() => {
                    showGameMessage(translate("Border dispute with") + " " + this.factions[factionId].name + " " + translate("has been resolved"));
                    this.closeDialog();
                    
                    // Reset theme after a delay
                    setTimeout(() => {
                        this.dialogThemes.border_dispute = {
                            active: false,
                            with: null,
                            progress: 0,
                            resolved: false
                        };
                    }, 1000);
                }, 2000);
                
            } else if (action === 'defy') {
                // Player defies demands, chance of war
                this.changeFactionRelation(factionId, -20);
                
                if (Math.random() < 0.4) {
                    // War breaks out
                    dialogMessage.textContent = translate("You leave us no choice but to defend our claims by force!");
                    this.setFactionRelation(factionId, 'enemy');
                    theme.resolved = true;
                    
                    // Reset theme after declaring war
                    setTimeout(() => {
                        this.dialogThemes.border_dispute = {
                            active: false,
                            with: null,
                            progress: 0,
                            resolved: false
                        };
                        this.closeDialog();
                    }, 2000);
                } else {
                    // One last chance for negotiation
                    dialogMessage.textContent = translate("Your stubbornness is testing our patience. We propose a compromise to avoid bloodshed.");
                    theme.progress = 2;
                    
                    // Update UI with compromise options
                    this.addThemeDialogOptions(dialogOptions, 'border_dispute', theme.progress, factionId);
                }
            }
        } else if (theme.progress === 2) {
            if (action === 'accept') {
                // Player accepts compromise
                this.changeFactionRelation(factionId, 10);
                
                // Minor resource penalty
                if (gameState.resources) {
                    gameState.resources.wood -= 10;
                    updateResourceUI();
                }
                
                dialogMessage.textContent = translate("A wise decision. This compromise will benefit both our peoples.");
                theme.resolved = true;
                
                // Show resolution message
                setTimeout(() => {
                    showGameMessage(translate("Border dispute with") + " " + this.factions[factionId].name + " " + translate("has been resolved amicably"));
                    this.closeDialog();
                    
                    // Reset theme after a delay
                    setTimeout(() => {
                        this.dialogThemes.border_dispute = {
                            active: false,
                            with: null,
                            progress: 0,
                            resolved: false
                        };
                    }, 1000);
                }, 2000);
                
            } else if (action === 'reject') {
                // Player rejects compromise, war is almost certain
                this.changeFactionRelation(factionId, -25);
                
                if (Math.random() < 0.75) {
                    // War breaks out
                    dialogMessage.textContent = translate("Then war it shall be! Our armies will take what is rightfully ours!");
                    this.setFactionRelation(factionId, 'enemy');
                    theme.resolved = true;
                    
                    // Reset theme after declaring war
                    setTimeout(() => {
                        this.dialogThemes.border_dispute = {
                            active: false,
                            with: null,
                            progress: 0,
                            resolved: false
                        };
                        this.closeDialog();
                    }, 2000);
                } else {
                    // They back down, but relationship is damaged
                    dialogMessage.textContent = translate("We will withdraw our claims for now, but this matter is not settled.");
                    theme.resolved = true;
                    
                    // Reset theme after a delay
                    setTimeout(() => {
                        this.dialogThemes.border_dispute = {
                            active: false,
                            with: null,
                            progress: 0,
                            resolved: false
                        };
                        this.closeDialog();
                    }, 2000);
                }
            }
        }
    },
    
    // Handle resource crisis storyline
    handleResourceCrisis(factionId, action) {
        const theme = this.dialogThemes.resource_crisis;
        const dialogMessage = document.getElementById('dialog-message');
        const faction = this.factions[factionId];
        const lang = currentLanguage === LANGUAGES.TR ? 'tr' : 'en';
        
        if (theme.progress === 1) {
            // Determine which resource they need
            const resourceType = faction.tradeBenefit || 'food';
            const resourceAmount = resourceType === 'food' ? 50 : resourceType === 'wood' ? 40 : 30;
            
            if (action === 'help') {
                // Check if player has enough resources
                if (gameState.resources && gameState.resources[resourceType] >= resourceAmount) {
                    // Player provides aid
                    gameState.resources[resourceType] -= resourceAmount;
                    updateResourceUI();
                    
                    // Significant relationship improvement
                    this.changeFactionRelation(factionId, 25);
                    
                    // Show grateful response
                    const responses = this.dialogResponses.resource_crisis_grateful[lang];
                    dialogMessage.textContent = responses[Math.floor(Math.random() * responses.length)];
                    
                    // Resolve theme
                    theme.resolved = true;
                    
                    // If relations are good enough, might become ally
                    if (faction.relationValue >= 75 && faction.relation !== 'ally') {
                        setTimeout(() => {
                            this.setFactionRelation(factionId, 'ally');
                            showGameMessage(faction.name + " " + translate("has become your ally"));
                        }, 2000);
                    }
                } else {
                    // Player doesn't have enough resources
                    dialogMessage.textContent = translate("You don't have enough resources to help us. How disappointing.");
                }
            } else if (action === 'refuse') {
                // Player refuses aid
                this.changeFactionRelation(factionId, -15);
                
                // Show angry response
                const responses = this.dialogResponses.resource_crisis_angry[lang];
                dialogMessage.textContent = responses[Math.floor(Math.random() * responses.length)];
                
                // Resolve theme
                theme.resolved = true;
                
                // If relations were already bad, might become enemy
                if (faction.relationValue < 30 && faction.relation !== 'enemy') {
                    setTimeout(() => {
                        this.setFactionRelation(factionId, 'enemy');
                        showGameMessage(faction.name + " " + translate("has become your enemy"));
                    }, 2000);
                }
            }
            
            // Close dialog and reset theme after delay
            setTimeout(() => {
                this.closeDialog();
                setTimeout(() => {
                    this.dialogThemes.resource_crisis = {
                        active: false,
                        with: null,
                        progress: 0,
                        resolved: false
                    };
                }, 1000);
            }, 3000);
        }
    },
    
    // Handle ancient relic storyline
    handleAncientRelic(factionId, action) {
        const theme = this.dialogThemes.ancient_relic;
        const dialogMessage = document.getElementById('dialog-message');
        const dialogOptions = document.getElementById('dialog-options');
        const faction = this.factions[factionId];
        const lang = currentLanguage === LANGUAGES.TR ? 'tr' : 'en';
        
        if (theme.progress === 1) {
            if (action === 'join') {
                // Player joins expedition
                this.changeFactionRelation(factionId, 10);
                
                // 50% chance of betrayal in the next stage
                if (Math.random() < 0.5) {
                    dialogMessage.textContent = translate("Excellent! Our expedition will depart immediately. We shall inform you of our findings.");
                    theme.progress = 2;
                    
                    // Betrayal will happen later
                    setTimeout(() => {
                        // Only proceed if theme is still active
                        if (this.dialogThemes.ancient_relic.active && this.dialogThemes.ancient_relic.with === factionId) {
                            showGameMessage(translate("The expedition with") + " " + faction.name + " " + translate("has made a discovery"));
                            
                            // Re-open dialog with betrayal message
                            this.openDialog(factionId);
                        }
                    }, 30000); // After 30 seconds in-game time
                } else {
                    // No betrayal, expedition succeeds
                    dialogMessage.textContent = translate("Our joint expedition was successful! The power of the relic shall benefit both our kingdoms.");
                    
                    // Both kingdoms get benefits
                    this.changeReputation(15);
                    if (gameState.military) {
                        gameState.military.attack += 5;
                        gameState.military.defense += 5;
                        updateMilitaryStats();
                    }
                    
                    theme.resolved = true;
                }
            } else if (action === 'decline') {
                // Player declines expedition
                this.changeFactionRelation(factionId, -5);
                dialogMessage.textContent = translate("A pity. We shall seek the relic ourselves then.");
                theme.resolved = true;
            }
            
            // Close dialog and reset theme if resolved
            if (theme.resolved) {
                setTimeout(() => {
                    this.closeDialog();
                    setTimeout(() => {
                        this.dialogThemes.ancient_relic = {
                            active: false,
                            with: null,
                            progress: 0,
                            resolved: false
                        };
                    }, 1000);
                }, 3000);
            }
        } else if (theme.progress === 2) {
            if (action === 'attack') {
                // Player attacks over betrayal
                this.setFactionRelation(factionId, 'enemy');
                dialogMessage.textContent = translate("You dare attack us? Then face the power of the relic in battle!");
                theme.resolved = true;
            } else if (action === 'accept') {
                // Player accepts betrayal, loses reputation but gains relation
                this.changeReputation(-10);
                this.changeFactionRelation(factionId, 5);
                dialogMessage.textContent = translate("A wise choice. Perhaps we can cooperate on other ventures in the future.");
                theme.resolved = true;
            }
            
            // Close dialog and reset theme
            setTimeout(() => {
                this.closeDialog();
                setTimeout(() => {
                    this.dialogThemes.ancient_relic = {
                        active: false,
                        with: null,
                        progress: 0,
                        resolved: false
                    };
                }, 1000);
            }, 3000);
        }
    },
    
    // Handle royal marriage storyline
    handleRoyalMarriage(factionId, action) {
        const theme = this.dialogThemes.royal_marriage;
        const dialogMessage = document.getElementById('dialog-message');
        const faction = this.factions[factionId];
        const lang = currentLanguage === LANGUAGES.TR ? 'tr' : 'en';
        
        if (theme.progress === 1) {
            if (action === 'accept') {
                // Player accepts marriage proposal
                const responses = this.dialogResponses.royal_marriage_accept[lang];
                dialogMessage.textContent = responses[Math.floor(Math.random() * responses.length)];
                
                // Significant relation improvement and permanent alliance
                this.setFactionRelation(factionId, 'ally');
                this.changeFactionRelation(factionId, 30);
                
                // Create a permanent alliance treaty
                const marriageTreaty = {
                    id: `marriage-${factionId}-${Date.now()}`,
                    type: 'marriage',
                    name: translate('Royal Marriage'),
                    parties: ['player', factionId],
                    duration: 999, // Essentially permanent
                    effects: {
                        relationBonus: 1.5,
                        defensiveAssistance: true,
                        tradingBonus: 1.3
                    },
                    icon: '👑'
                };
                
                this.treaties.push(marriageTreaty);
                this.updateTreatiesList();
                
                // Show notification
                setTimeout(() => {
                    showGameMessage(translate("A royal marriage has united your kingdom with") + " " + faction.name);
                }, 2000);
            } else if (action === 'reject') {
                // Player rejects marriage proposal
                const responses = this.dialogResponses.royal_marriage_reject[lang];
                dialogMessage.textContent = responses[Math.floor(Math.random() * responses.length)];
                
                // Relation penalty
                this.changeFactionRelation(factionId, -15);
            }
            
            // Resolve theme
            theme.resolved = true;
            
            // Close dialog and reset theme
            setTimeout(() => {
                this.closeDialog();
                setTimeout(() => {
                    this.dialogThemes.royal_marriage = {
                        active: false,
                        with: null,
                        progress: 0,
                        resolved: false
                    };
                }, 1000);
            }, 3000);
        }
    },
    
    // Bribe officials to improve relations with hostile faction
    bribeOfficials(factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        const bribeCost = 75; // Gold cost for bribe
        
        // Check if player has enough gold
        if (!economySystem || !economySystem.hasEnoughGold(bribeCost)) {
            // Not enough gold
            showGameMessage(translate("Yetkililere rüşvet vermek için yeterli altın yok"));
            return;
        }
        
        // Deduct gold using the proper method
        if (economySystem.spendGoldOnDiplomacy(bribeCost, `${faction.name} yetkililerine rüşvet`)) {
            // Improve relation but limit effect if they're an enemy
            this.changeFactionRelation(factionId, 15);
            
            // Show success message
            showGameMessage(translate("Rüşvetleriniz") + " " + faction.name + " " + translate("ile ilişkilerinizi geliştirdi"));
            
            // If relation is high enough, might change to neutral
            if (faction.relationValue >= 35 && faction.relation === 'enemy') {
                this.setFactionRelation(factionId, 'neutral');
                showGameMessage(faction.name + " " + translate("artık size karşı tarafsız"));
            }
        }
    },
    
    // Offer ceasefire in exchange for gold
    offerCeasefire(factionId) {
        const faction = this.factions[factionId];
        const dialogMessage = document.getElementById('dialog-message');
        const dialogOptions = document.getElementById('dialog-options');
        
        const ceasefireCost = 50; // Gold cost for ceasefire
        
        // Check if player has enough gold
        if (!economySystem || economySystem.treasury < ceasefireCost) {
            dialogMessage.textContent = translate("Ateşkes teklif etmek için yeterli altınınız yok. Hazine daha dolu olduğunda geri gelin.");
            
            // Update options to just close
            dialogOptions.innerHTML = '';
            const closeBtn = document.createElement('button');
            closeBtn.className = 'dialog-option';
            closeBtn.dataset.option = 'close';
            closeBtn.textContent = translate('Kapat');
            dialogOptions.appendChild(closeBtn);
            
            return;
        }
        
        // Calculate acceptance chance based on relation value and military situation
        let acceptanceChance = 20 + (faction.relationValue * 0.5);
        
        // If faction military is weaker, more likely to accept
        const factionKingdomId = Object.keys(gameState.kingdoms).find(key => 
            this.getKingdomFactionId(key) === factionId
        );
        
        if (factionKingdomId) {
            const factionKingdom = gameState.kingdoms[factionKingdomId];
            if (factionKingdom) {
                // Rough estimate of military power
                const playerMilitary = gameState.military ? 
                    (gameState.military.attack + gameState.military.defense) : 15;
                    
                const factionMilitary = faction.militaryStrength || 50;
                
                if (playerMilitary > factionMilitary) {
                    acceptanceChance += 25; // Significantly more likely to accept if weaker
                } else {
                    acceptanceChance -= 15; // Less likely if stronger
                }
            }
        }
        
        // Roll for acceptance
        if (Math.random() * 100 < acceptanceChance) {
            // Accept ceasefire
            // Use proper method to spend gold from treasury
            if (!economySystem.spendGoldOnDiplomacy(ceasefireCost, `${faction.name} ile ateşkes`)) {
                // If somehow gold is no longer available
                dialogMessage.textContent = translate("Ateşkes teklif etmek için yeterli altınınız yok.");
                return;
            }
            
            // Set relation to truce 
            this.setFactionRelation(factionId, 'truce');
            
            // Create ceasefire treaty
            const treatyDuration = 8 + Math.floor(Math.random() * 5); // 8-12 years
            
            const ceasefireTreaty = {
                id: `ceasefire-${factionId}-${Date.now()}`,
                type: 'ceasefire',
                name: 'Ateşkes Anlaşması',
                parties: ['player', factionId],
                duration: treatyDuration,
                effects: {
                    preventWar: true
                },
                icon: '🕊️'
            };
            
            this.treaties.push(ceasefireTreaty);
            
            // Show acceptance message
            const lang = 'tr'; // Always use Turkish
            const responses = this.dialogResponses['peace_accept'][lang];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            dialogMessage.textContent = randomResponse;
            
            // Update dialog options
            dialogOptions.innerHTML = '';
            const closeBtn = document.createElement('button');
            closeBtn.className = 'dialog-option';
            closeBtn.dataset.option = 'close';
            closeBtn.textContent = translate('Mükemmel');
            dialogOptions.appendChild(closeBtn);
            
            // Show game message
            showGameMessage(`${faction.name} ${treatyDuration} yıllığına ateşkes teklifinizi kabul etti!`);
            
            // Update UI
            this.updateDiplomacyUI();
        } else {
            // Reject ceasefire
            // Show rejection message
            const lang = 'tr'; // Always use Turkish
            const responses = this.dialogResponses['peace_reject'][lang];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            dialogMessage.textContent = randomResponse;
            
            // Update dialog options
            dialogOptions.innerHTML = '';
            const closeBtn = document.createElement('button');
            closeBtn.className = 'dialog-option';
            closeBtn.dataset.option = 'close';
            closeBtn.textContent = translate('Anlıyorum...');
            dialogOptions.appendChild(closeBtn);
            
            // Show game message
            showGameMessage(`${faction.name} ateşkes teklifinizi reddetti!`);
        }
    },
    
    // Propose trade with a faction
    proposeTrade(factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Create trade dialog
        if (!document.getElementById('trade-dialog')) {
            const tradeDialogHTML = `
                <div id="trade-dialog" class="trade-dialog">
                    <div class="dialog-header">
                        <h3 id="trade-faction-name">Kingdom Name</h3>
                        <button id="close-trade-dialog" class="close-button">
                            <i class="material-icons-round">close</i>
                        </button>
                    </div>
                    <div class="dialog-content">
                        <div class="trade-message" id="trade-message">
                            ${translate("Hangi kaynakları takas etmek istersiniz?")}
                        </div>
                        
                        <div class="trade-info">
                            <h4>${translate("Kaynak Değerleri")}</h4>
                            <div class="resource-values">
                                <span>Odun: 1</span>
                                <span>Taş: 1.5</span>
                                <span>Yiyecek: 0.8</span>
                                <span>Altın: 3</span>
                            </div>
                        </div>
                        
                        <div class="trade-section">
                            <div class="trade-offer">
                                <h4>${translate("Teklifiniz")}</h4>
                                <div class="resource-selection">
                                    <div class="resource-type">
                                        <label>${translate("Odun")}:</label>
                                        <div class="amount-control">
                                            <button class="decrease-button" data-resource="wood" data-side="player">-</button>
                                            <span class="amount-display" id="player-wood-amount">0</span>
                                            <button class="increase-button" data-resource="wood" data-side="player">+</button>
                                        </div>
                                    </div>
                                    <div class="resource-type">
                                        <label>${translate("Taş")}:</label>
                                        <div class="amount-control">
                                            <button class="decrease-button" data-resource="stone" data-side="player">-</button>
                                            <span class="amount-display" id="player-stone-amount">0</span>
                                            <button class="increase-button" data-resource="stone" data-side="player">+</button>
                                        </div>
                                    </div>
                                    <div class="resource-type">
                                        <label>${translate("Yiyecek")}:</label>
                                        <div class="amount-control">
                                            <button class="decrease-button" data-resource="food" data-side="player">-</button>
                                            <span class="amount-display" id="player-food-amount">0</span>
                                            <button class="increase-button" data-resource="food" data-side="player">+</button>
                                        </div>
                                    </div>
                                    <div class="resource-type">
                                        <label>${translate("Altın")}:</label>
                                        <div class="amount-control">
                                            <button class="decrease-button" data-resource="gold" data-side="player">-</button>
                                            <span class="amount-display" id="player-gold-amount">0</span>
                                            <button class="increase-button" data-resource="gold" data-side="player">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="trade-arrow">
                                <i class="material-icons-round">swap_vert</i>
                            </div>
                            
                            <div class="trade-offer">
                                <h4>${translate("Onların Teklifi")}</h4>
                                <div class="resource-selection">
                                    <div class="resource-type">
                                        <label>${translate("Odun")}:</label>
                                        <div class="amount-control">
                                            <button class="decrease-button" data-resource="wood" data-side="faction">-</button>
                                            <span class="amount-display" id="faction-wood-amount">0</span>
                                            <button class="increase-button" data-resource="wood" data-side="faction">+</button>
                                        </div>
                                    </div>
                                    <div class="resource-type">
                                        <label>${translate("Taş")}:</label>
                                        <div class="amount-control">
                                            <button class="decrease-button" data-resource="stone" data-side="faction">-</button>
                                            <span class="amount-display" id="faction-stone-amount">0</span>
                                            <button class="increase-button" data-resource="stone" data-side="faction">+</button>
                                        </div>
                                    </div>
                                    <div class="resource-type">
                                        <label>${translate("Yiyecek")}:</label>
                                        <div class="amount-control">
                                            <button class="decrease-button" data-resource="food" data-side="faction">-</button>
                                            <span class="amount-display" id="faction-food-amount">0</span>
                                            <button class="increase-button" data-resource="food" data-side="faction">+</button>
                                        </div>
                                    </div>
                                    <div class="resource-type">
                                        <label>${translate("Altın")}:</label>
                                        <div class="amount-control">
                                            <button class="decrease-button" data-resource="gold" data-side="faction">-</button>
                                            <span class="amount-display" id="faction-gold-amount">0</span>
                                            <button class="increase-button" data-resource="gold" data-side="faction">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="deal-evaluation" id="deal-evaluation">
                            <span id="deal-status">Teklif bekliyor...</span>
                        </div>
                        
                        <div class="trade-actions">
                            <button id="propose-trade-button" class="trade-button">${translate("Takas Teklif Et")}</button>
                            <button id="counter-offer-button" class="trade-button">${translate("Karşı Teklif İste")}</button>
                            <button id="cancel-trade-button" class="trade-button secondary">${translate("İptal")}</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Add trade dialog to the DOM
            const tradeDialogContainer = document.createElement('div');
            tradeDialogContainer.innerHTML = tradeDialogHTML;
            document.body.appendChild(tradeDialogContainer.firstElementChild);
            
            // Set up event listeners for trade dialog
            this.setupTradeDialogListeners();
        }
        
        // Reset trade amounts
        this.tradeOffer = {
            player: { wood: 0, stone: 0, food: 0, gold: 0 },
            faction: { wood: 0, stone: 0, food: 0, gold: 0 }
        };
        
        // Update trade UI
        this.updateTradeUI();
        
        // Set current faction for trade
        const tradeDialog = document.getElementById('trade-dialog');
        const tradeFactionName = document.getElementById('trade-faction-name');
        
        tradeDialog.dataset.factionId = factionId;
        tradeFactionName.textContent = faction.name;
        
        // Generate initial faction offer based on faction preferences
        this.generateFactionOffer(factionId);
        
        // Show trade dialog
        tradeDialog.style.display = 'block';
    },
    
    // Set up event listeners for trade dialog
    setupTradeDialogListeners() {
        // Close button
        const closeButton = document.getElementById('close-trade-dialog');
        closeButton.addEventListener('click', () => {
            document.getElementById('trade-dialog').style.display = 'none';
        });
        
        // Cancel button
        const cancelButton = document.getElementById('cancel-trade-button');
        cancelButton.addEventListener('click', () => {
            document.getElementById('trade-dialog').style.display = 'none';
        });
        
        // Resource amount control buttons
        const decreaseButtons = document.querySelectorAll('.decrease-button');
        const increaseButtons = document.querySelectorAll('.increase-button');
        
        decreaseButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const resource = e.target.dataset.resource;
                const side = e.target.dataset.side;
                
                if (this.tradeOffer[side][resource] > 0) {
                    this.tradeOffer[side][resource] -= 5;
                    if (this.tradeOffer[side][resource] < 0) this.tradeOffer[side][resource] = 0;
                    this.updateTradeUI();
                }
            });
        });
        
        increaseButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const resource = e.target.dataset.resource;
                const side = e.target.dataset.side;
                
                // Check resource limits for player side
                if (side === 'player') {
                    const maxAmount = this.getPlayerResourceAmount(resource);
                    if (this.tradeOffer.player[resource] < maxAmount) {
                        this.tradeOffer.player[resource] += 5;
                        if (this.tradeOffer.player[resource] > maxAmount) {
                            this.tradeOffer.player[resource] = maxAmount;
                        }
                    } else {
                        // Show message if player tries to give more than they have
                        showGameMessage(`Daha fazla ${translate(resource)} veremezsiniz!`);
                    }
                } else {
                    // Faction side limits - more strict limits
                    let resourceLimit = 100; // Default limit for most resources
                    let increaseAmount = 5; // Default increase amount
                    
                    // Kaynak bazlı limitler
                    if (resource === 'gold') {
                        resourceLimit = 25; // Altın için çok daha düşük limit
                        increaseAmount = 2; // Altın için daha küçük artış
                        
                        // Altın için rastgele başarısızlık şansı
                        if (Math.random() > 0.3) {
                            // %70 şans ile altın artırma başarısız olur
                            if (this.tradeOffer.faction.gold > 10) {
                                showGameMessage(`${this.factions[document.getElementById('trade-dialog').dataset.factionId].name} daha fazla altın teklif etmeyi reddediyor.`);
                                return;
                            }
                        }
                    } else if (resource === 'stone') {
                        resourceLimit = 80; // Taş için limit
                    }
                    
                    if (this.tradeOffer.faction[resource] < resourceLimit) {
                        this.tradeOffer.faction[resource] += increaseAmount;
                        
                        // Sınırı aşmadığından emin ol
                        if (this.tradeOffer.faction[resource] > resourceLimit) {
                            this.tradeOffer.faction[resource] = resourceLimit;
                            showGameMessage(`Maksimum ${translate(resource)} miktarına ulaştınız.`);
                        }
                    } else {
                        showGameMessage(`${translate(resource)} miktarı maksimuma ulaştı!`);
                    }
                }
                
                this.updateTradeUI();
            });
        });
        
        // Trade button
        const tradeButton = document.getElementById('propose-trade-button');
        tradeButton.addEventListener('click', () => {
            const factionId = document.getElementById('trade-dialog').dataset.factionId;
            
            // Check if there's anything to trade (prevent empty trades)
            const playerHasOffered = Object.values(this.tradeOffer.player).some(val => val > 0);
            const factionHasOffered = Object.values(this.tradeOffer.faction).some(val => val > 0);
            
            if (!playerHasOffered && !factionHasOffered) {
                showGameMessage(translate("Hiçbir şey takas etmediniz!"));
                return;
            }
            
            // Kaynak değerleri
            const resourceValues = {
                wood: 1.0,   // Odun temel değer
                stone: 1.5,  // Taş odundan daha değerli
                food: 0.8,   // Yiyecek odundan biraz daha az değerli
                gold: 3.0    // Altın en değerli kaynak
            };
            
            // Calculate value of player and faction offers
            const playerOfferValue = 
                this.tradeOffer.player.wood * resourceValues.wood + 
                this.tradeOffer.player.stone * resourceValues.stone + 
                this.tradeOffer.player.food * resourceValues.food + 
                this.tradeOffer.player.gold * resourceValues.gold;
                
            const factionOfferValue = 
                this.tradeOffer.faction.wood * resourceValues.wood + 
                this.tradeOffer.faction.stone * resourceValues.stone + 
                this.tradeOffer.faction.food * resourceValues.food + 
                this.tradeOffer.faction.gold * resourceValues.gold;
            
            // Calculate ratio and acceptance chance
            let acceptanceChance = 0; // Default to 0
            
            if (playerOfferValue === 0) {
                // Player is requesting resources for free
                acceptanceChance = 0;
                showGameMessage(translate("Karşılığında bir şey vermeden takas isteğinde bulunamazsınız!"));
                return;
            } else if (factionOfferValue === 0) {
                // Player is offering free resources, always accepted unless it's too much gold
                if (this.tradeOffer.player.gold > 50) {
                    // Krallık şüphelenir, çok fazla bedava altın teklif ediyorsunuz
                    showGameMessage(translate("Bu kadar altını bedava vermeniz şüpheli, teklif reddedildi."));
                    return;
                }
                acceptanceChance = 100;
            } else {
                // Calculate the ratio of value (faction value / player value)
                const ratio = factionOfferValue / playerOfferValue;
                
                // Fraksiyon çok fazla altın talep ediyorsa hiç kabul etme
                if (this.tradeOffer.faction.gold > 40) {
                    showGameMessage(translate("Bu kadar çok altın talep etmek gerçekçi değil."));
                    return;
                }
                
                // Orantısız talepler için adil kontrol
                if (ratio > 2.0) {
                    // Oyuncu çok az şey teklif ediyor ve çok fazla şey istiyor
                    showGameMessage(translate("Bu teklif çok dengesiz, daha adil bir teklif sunun."));
                    return;
                }
                
                // Adjust acceptance chance based on ratio - daha gerçekçi ticaret şansları
                if (ratio > 1.5) {
                    // Faction would lose in this trade
                    acceptanceChance = 5; // Very unlikely to accept
                } else if (ratio > 1.2) {
                    // Somewhat unfair to faction
                    acceptanceChance = 10 + (1.5 - ratio) * 100; // 10-40% chance
                } else if (ratio > 1.0) {
                    // Slightly unfair to faction
                    acceptanceChance = 40 + (1.2 - ratio) * 200; // 40-80% chance
                } else if (ratio > 0.8) {
                    // Fair trade for both
                    acceptanceChance = 80; // High chance to accept
                } else if (ratio > 0.5) {
                    // Good for faction
                    acceptanceChance = 90; // Very high chance
                } else {
                    // Excellent for faction
                    acceptanceChance = 95; // Almost certain
                }
            }
            
            // Adjust by relation
            const faction = this.factions[factionId];
            if (faction) {
                if (faction.relation === 'ally') {
                    acceptanceChance += 10;
                } else if (faction.relation === 'enemy') {
                    acceptanceChance -= 15;
                }
                
                // Special case for gold - faction is more cautious with gold
                if (this.tradeOffer.faction.gold > 0) {
                    const goldRatio = this.tradeOffer.faction.gold / (playerOfferValue / resourceValues.gold);
                    if (goldRatio > 1.0) {
                        // Daha fazla altın veriyorlarsa, kabul etme şansı düşer
                        acceptanceChance -= (goldRatio - 1.0) * 30;
                    }
                }
                
                // Cap chance
                acceptanceChance = Math.max(5, Math.min(95, acceptanceChance));
                
                // Debug message
                console.log(`Trade acceptance chance: ${acceptanceChance.toFixed(1)}% (Ratio: ${(factionOfferValue/playerOfferValue).toFixed(2)})`);
                
                // Roll for acceptance
                if (Math.random() * 100 < acceptanceChance) {
                    // Accept and execute trade
                    this.executeTrade(factionId);
                } else {
                    // Reject trade and give a reason
                    const ratio = factionOfferValue / playerOfferValue;
                    let rejectMessage = `${faction.name} teklifinizi reddetti.`;
                    
                    if (ratio > 1.3) {
                        rejectMessage += " Teklifiniz onlar için çok kötü bir anlaşma.";
                    } else if (ratio > 1.0) {
                        rejectMessage += " Daha iyi bir teklif bekliyorlar.";
                    } else {
                        rejectMessage += " Şu an ticaret yapmak istemiyorlar.";
                    }
                    
                    showGameMessage(rejectMessage);
                }
            }
        });
        
        // Counter offer button
        const counterOfferButton = document.getElementById('counter-offer-button');
        counterOfferButton.addEventListener('click', () => {
            const factionId = document.getElementById('trade-dialog').dataset.factionId;
            this.generateFactionOffer(factionId, true);
        });
    },
    
    // Get player's current resource amount
    getPlayerResourceAmount(resource) {
        if (resource === 'gold' && economySystem) {
            return economySystem.treasury;
        } else if (gameState.resources && gameState.resources[resource] !== undefined) {
            return gameState.resources[resource];
        }
        return 0;
    },
    
    // Update trade UI with current offer
    updateTradeUI() {
        // Update player side
        document.getElementById('player-wood-amount').textContent = this.tradeOffer.player.wood;
        document.getElementById('player-stone-amount').textContent = this.tradeOffer.player.stone;
        document.getElementById('player-food-amount').textContent = this.tradeOffer.player.food;
        document.getElementById('player-gold-amount').textContent = this.tradeOffer.player.gold;
        
        // Update faction side
        document.getElementById('faction-wood-amount').textContent = this.tradeOffer.faction.wood;
        document.getElementById('faction-stone-amount').textContent = this.tradeOffer.faction.stone;
        document.getElementById('faction-food-amount').textContent = this.tradeOffer.faction.food;
        document.getElementById('faction-gold-amount').textContent = this.tradeOffer.faction.gold;
        
        // Teklif değerlendirmesi yap
        const resourceValues = {
            wood: 1.0,
            stone: 1.5,
            food: 0.8,
            gold: 3.0
        };
        
        // Teklif değerlerini hesapla
        const playerOfferValue = 
            this.tradeOffer.player.wood * resourceValues.wood + 
            this.tradeOffer.player.stone * resourceValues.stone + 
            this.tradeOffer.player.food * resourceValues.food + 
            this.tradeOffer.player.gold * resourceValues.gold;
            
        const factionOfferValue = 
            this.tradeOffer.faction.wood * resourceValues.wood + 
            this.tradeOffer.faction.stone * resourceValues.stone + 
            this.tradeOffer.faction.food * resourceValues.food + 
            this.tradeOffer.faction.gold * resourceValues.gold;
        
        // Deal evaluation bölümünü güncelle
        const dealEvaluation = document.getElementById('deal-evaluation');
        const dealStatus = document.getElementById('deal-status');
        
        // Teklif boşsa değerlendirme gösterme
        if (playerOfferValue === 0 && factionOfferValue === 0) {
            dealEvaluation.className = 'deal-evaluation';
            dealStatus.textContent = "Teklif bekliyor...";
            return;
        }
        
        // Tek taraflı teklif mi?
        if (playerOfferValue === 0) {
            dealEvaluation.className = 'deal-evaluation deal-unfair';
            dealStatus.textContent = "Tek taraflı teklif - reddedilecek";
            return;
        }
        
        if (factionOfferValue === 0) {
            dealEvaluation.className = 'deal-evaluation deal-neutral';
            dealStatus.textContent = "Kaynak bağışı - kabul edilecek";
            return;
        }
        
        // Oran hesapla
        const ratio = factionOfferValue / playerOfferValue;
        
        // Değerlendirme yap
        if (ratio > 1.5) {
            dealEvaluation.className = 'deal-evaluation deal-unfair';
            dealStatus.textContent = "Reddedilebilir teklif - çok fazla istiyorsunuz";
        } else if (ratio > 1.2) {
            dealEvaluation.className = 'deal-evaluation deal-unfair';
            dealStatus.textContent = "Dengesiz teklif - kabul olasılığı düşük";
        } else if (ratio > 1.0) {
            dealEvaluation.className = 'deal-evaluation deal-neutral';
            dealStatus.textContent = "Makul teklif - kabulü mümkün";
        } else if (ratio > 0.8) {
            dealEvaluation.className = 'deal-evaluation deal-fair';
            dealStatus.textContent = "Adil teklif - kabul olasılığı yüksek";
        } else if (ratio > 0.5) {
            dealEvaluation.className = 'deal-evaluation deal-fair';
            dealStatus.textContent = "Size avantajlı teklif - muhtemelen kabul edilecek";
        } else {
            dealEvaluation.className = 'deal-evaluation deal-fair';
            dealStatus.textContent = "Size çok avantajlı - kesinlikle kabul edilecek";
        }
        
        // Altın uyarısı
        if (this.tradeOffer.faction.gold > 20) {
            dealEvaluation.className = 'deal-evaluation deal-unfair';
            dealStatus.textContent = "Bu kadar altın istenmesi gerçekçi değil";
        }
    },
    
    // Generate a trade offer from the faction
    generateFactionOffer(factionId, isCounterOffer = false) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Kaynak değerleri - oyundaki ekonomik dengeyi sağlamak için
        const resourceValues = {
            wood: 1.0,    // Odun temel değer
            stone: 1.5,   // Taş odundan daha değerli
            food: 0.8,    // Yiyecek odundan biraz daha az değerli
            gold: 3.0     // Altın en değerli kaynak
        };
        
        // Reset faction offer
        this.tradeOffer.faction = { wood: 0, stone: 0, food: 0, gold: 0 };
        
        // If this is a counter offer, adjust based on player's offer
        if (isCounterOffer) {
            const tradeMessage = document.getElementById('trade-message');
            
            // If player hasn't offered anything substantial, faction is not interested
            const playerTotalOffer = this.tradeOffer.player.wood + this.tradeOffer.player.stone + 
                                    this.tradeOffer.player.food + (this.tradeOffer.player.gold * 3);
            
            if (playerTotalOffer < 10) {
                tradeMessage.textContent = translate("Önce değerli bir şey teklif edin.");
                return;
            }
            
            // Set message based on faction's relation
            if (faction.relation === 'ally') {
                tradeMessage.textContent = translate("Müttefik olarak, size karşılığında bunu sunabiliriz.");
            } else if (faction.relation === 'neutral') {
                tradeMessage.textContent = translate("Bu ticareti önerebiliriz. Ya kabul edin ya da bırakın.");
            } else if (faction.relation === 'enemy' || faction.relation === 'truce') {
                tradeMessage.textContent = translate("Farklılıklarımıza rağmen, iş iştir.");
            }
            
            // Determine which resource the faction prefers to give
            const preferredResource = faction.tradeBenefit || this.getRandomTradeBenefit();
            
            // Calculate a fair exchange based on relationship
            let fairnessMultiplier = 0.9; // Neutral exchange - biraz kendi çıkarlarını düşünürler
            if (faction.relation === 'ally') fairnessMultiplier = 1.1; // Allies give more
            if (faction.relation === 'enemy') fairnessMultiplier = 0.7; // Enemies give less
            
            // Calculate total value of player offer
            const totalValue = 
                this.tradeOffer.player.wood * resourceValues.wood + 
                this.tradeOffer.player.stone * resourceValues.stone + 
                this.tradeOffer.player.food * resourceValues.food + 
                this.tradeOffer.player.gold * resourceValues.gold;
            
            // Calculate how much of preferred resource to offer
            const resourceValue = resourceValues[preferredResource];
            
            // Talep edilen kaynak miktarını sınırla - özellikle altın için sert limit
            let resourceAmount = Math.floor((totalValue * fairnessMultiplier) / resourceValue);
            
            if (preferredResource === 'gold') {
                // Altın için maksimum miktar sınırlaması
                const maxGold = 30 + (faction.relationValue / 2); // İlişki iyiyse biraz daha fazla verebilirler
                resourceAmount = Math.min(resourceAmount, maxGold);
            } else {
                // Diğer kaynaklar için daha yüksek sınır
                resourceAmount = Math.min(resourceAmount, 100);
            }
            
            // Set the offer
            this.tradeOffer.faction[preferredResource] = resourceAmount;
            
            // Also offer some gold if player is giving resources but only if they're not already offering gold
            if (preferredResource !== 'gold' && 
                (this.tradeOffer.player.wood > 0 || this.tradeOffer.player.stone > 0 || this.tradeOffer.player.food > 0)) {
                // Altın miktarını düşük tut
                const goldAmount = Math.floor(totalValue * 0.1 * fairnessMultiplier);
                this.tradeOffer.faction.gold = Math.min(goldAmount, 15); // Maksimum 15 altın ek olarak verebilirler
            }
        } else {
            // Initial offer - faction offers their specialty
            const tradeMessage = document.getElementById('trade-message');
            tradeMessage.textContent = translate(`Size ${faction.tradeBenefit} sunabiliriz. Karşılığında ne teklif edeceksiniz?`);
            
            // Set initial offering of their specialty with reasonable amounts
            let initialAmount = 0;
            if (faction.tradeBenefit === 'gold') {
                initialAmount = 5 + Math.floor(Math.random() * 10); // Gold is more valuable, offer less
            } else {
                initialAmount = 15 + Math.floor(Math.random() * 15); // Other resources, more generous
            }
            
            this.tradeOffer.faction[faction.tradeBenefit] = initialAmount;
        }
        
        // Update UI
        this.updateTradeUI();
    },
    
    // Execute the trade
    executeTrade(factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Verify player has enough resources
        const { wood, stone, food, gold } = this.tradeOffer.player;
        
        let canAfford = true;
        const missingResources = [];
        
        // Check wood
        if (wood > 0) {
            if (gameState.resources && gameState.resources.wood < wood) {
                canAfford = false;
                missingResources.push('odun');
            }
        }
        
        // Check stone
        if (stone > 0) {
            if (gameState.resources && gameState.resources.stone < stone) {
                canAfford = false;
                missingResources.push('taş');
            }
        }
        
        // Check food
        if (food > 0) {
            if (gameState.resources && gameState.resources.food < food) {
                canAfford = false;
                missingResources.push('yiyecek');
            }
        }
        
        // Check gold
        if (gold > 0) {
            if (!economySystem || economySystem.treasury < gold) {
                canAfford = false;
                missingResources.push('altın');
            }
        }
        
        if (!canAfford) {
            // Show error message
            const message = `Ticareti tamamlamak için yeterli ${missingResources.join(', ')} yok.`;
            showGameMessage(message);
            return;
        }
        
        // Execute the trade - first give resources to faction
        // Deduct player resources
        if (wood > 0 && gameState.resources) {
            gameState.resources.wood -= wood;
        }
        if (stone > 0 && gameState.resources) {
            gameState.resources.stone -= stone;
        }
        if (food > 0 && gameState.resources) {
            gameState.resources.food -= food;
        }
        if (gold > 0 && economySystem) {
            economySystem.treasury -= gold;
            gameState.economy.gold = economySystem.treasury; // Keep gold synchronized
            economySystem.updateEconomyUI();
        }
        
        // Add faction resources to player
        const { wood: fWood, stone: fStone, food: fFood, gold: fGold } = this.tradeOffer.faction;
        
        if (fWood > 0 && gameState.resources) {
            gameState.resources.wood += fWood;
        }
        if (fStone > 0 && gameState.resources) {
            gameState.resources.stone += fStone;
        }
        if (fFood > 0 && gameState.resources) {
            gameState.resources.food += fFood;
        }
        if (fGold > 0 && economySystem) {
            economySystem.treasury += fGold;
            gameState.economy.gold = economySystem.treasury; // Keep gold synchronized
            economySystem.updateEconomyUI();
            showGameMessage(`Takas ile ${fGold} altın kazandınız!`); // Indicate gold gain
        }
        
        // Update resource UI
        if (gameState.resources) {
            updateResourceUI();
        }
        
        // Improve relations slightly
        this.changeFactionRelation(factionId, 5);
        
        // Show success message
        showGameMessage(`${faction.name} ile ticaret başarıyla tamamlandı!`);
        
        // Create trade treaty if one doesn't exist
        const existingTradeTreaty = this.treaties.find(treaty => 
            treaty.type === 'trade' && 
            treaty.parties.includes('player') && 
            treaty.parties.includes(factionId)
        );
        
        if (!existingTradeTreaty) {
            const tradeTreaty = {
                id: `trade-${factionId}-${Date.now()}`,
                type: 'trade',
                name: 'Ticaret Anlaşması',
                parties: ['player', factionId],
                duration: 10, // 10 years
                effects: {
                    tradingBonus: 1.2
                },
                icon: '📜'
            };
            
            this.treaties.push(tradeTreaty);
            this.updateTreatiesList();
        }
        
        // Close trade dialog
        const tradeDialog = document.getElementById('trade-dialog');
        if (tradeDialog) {
            tradeDialog.style.display = 'none';
        }
    },
    
    // Alliance proposal
    proposeAlliance(factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Alliances can only be proposed to neutral or truce factions
        if (faction.relation !== 'neutral' && faction.relation !== 'truce') {
            showGameMessage(`${faction.name} ile ittifak öneremezsiniz.`);
            return;
        }
        
        // Check if player has enough gold for alliance
        const allianceCost = 50; // Gold cost to form alliance
        if (!economySystem || !economySystem.hasEnoughGold(allianceCost)) {
            showGameMessage(`İttifak önermek için ${allianceCost} altına ihtiyacınız var.`);
            return;
        }
        
        // Calculate chance of acceptance based on relation value
        const acceptanceChance = Math.min(90, faction.relationValue - 10);
        
        // Roll for acceptance
        if (Math.random() * 100 < acceptanceChance) {
            // Accept alliance
            this.setFactionRelation(factionId, 'ally');
            
            // Deduct gold cost using proper method
            if (!economySystem.spendGoldOnDiplomacy(allianceCost, `${faction.name} ile ittifak`)) {
                showGameMessage(`İttifak kurmak için yeterli altın kalmadı.`);
                return;
            }
            
            // Create alliance treaty
            const allianceTreaty = {
                id: `alliance-${factionId}-${Date.now()}`,
                type: 'alliance',
                name: 'Askeri İttifak',
                parties: ['player', factionId],
                duration: 20, // 20 years
                effects: {
                    defensiveAssistance: true
                },
                icon: '⚔️'
            };
            
            this.treaties.push(allianceTreaty);
            
            // Show success message
            showGameMessage(`${faction.name} ittifak teklifinizi kabul etti!`);
        } else {
            // Reject alliance but DO NOT improve relations
            // Removed: this.changeFactionRelation(factionId, 5);
            
            // Show rejection message
            showGameMessage(`${faction.name} şu an için ittifak teklifinizi reddetti, ancak teklifinizi değerlendirdi.`);
        }
        
        // Update UI
        this.updateDiplomacyUI();
    },
    
    // Declare war on a faction
    declareWar(factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Cannot declare war on allies
        if (faction.relation === 'ally') {
            showGameMessage(translate("Cannot declare war on an ally! Break alliance first."));
            return;
        }
        
        // Check for ceasefire treaty
        const ceasefireTreaty = this.treaties.find(treaty => 
            treaty.type === 'ceasefire' && 
            treaty.parties.includes('player') && 
            treaty.parties.includes(factionId)
        );
        
        // Cannot declare war while under ceasefire
        if (ceasefireTreaty || faction.relation === 'truce') {
            showGameMessage(translate("Cannot declare war while under ceasefire! Wait until the treaty expires."));
            return;
        }
        
        // Create war declaration
        const warTreaty = {
            id: `war-${factionId}-${Date.now()}`,
            type: 'war',
            name: translate('War Declaration'),
            parties: ['player'],
            targetFaction: factionId,
            duration: null, // War continues until peace is made
            startDate: Math.floor(gameState.gameYear),
            effects: {
                preventTrade: true,
                allowAttacks: true
            },
            icon: '⚔️'
        };
        
        this.treaties.push(warTreaty);
        
        // Set relation to enemy
        this.setFactionRelation(factionId, 'enemy');
        
        // Decrease relation value further
        this.changeFactionRelation(factionId, -25);
        
        // Show message
        showGameMessage(translate("War declared against") + " " + faction.name + "!");
        
        // Update treaties UI
        this.updateTreatiesList();
        
        // Check if allies will join the war against player
        this.checkForAlliedResponse(factionId);
    },
    
    // Check if allies will join the war
    checkForAlliedResponse(targetFactionId) {
        const alliances = this.treaties.filter(treaty => 
            treaty.type === 'military' && 
            treaty.parties.includes(targetFactionId)
        );
        
        alliances.forEach(alliance => {
            const allyId = alliance.parties.find(party => party !== 'player' && party !== targetFactionId);
            if (allyId) {
                const ally = this.factions[allyId];
                showGameMessage(`${ally.name} has joined the war against you as an ally of ${this.factions[targetFactionId].name}!`);
                this.setFactionRelation(allyId, 'enemy');
            }
        });
    },
    
    // Change faction relation value
    changeFactionRelation(factionId, amount) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Update relation value but keep it within bounds
        faction.relationValue += amount;
        if (faction.relationValue > 100) faction.relationValue = 100;
        if (faction.relationValue < 0) faction.relationValue = 0;
        
        // Check if relation type should change based on new value
        if (faction.relationValue >= 75 && faction.relation !== 'ally') {
            this.setFactionRelation(factionId, 'ally');
        } else if (faction.relationValue <= 25 && faction.relation !== 'enemy' && faction.relation !== 'truce') {
            this.setFactionRelation(factionId, 'enemy');
        } else if (faction.relationValue > 25 && faction.relationValue < 75 && 
                  faction.relation !== 'neutral' && faction.relation !== 'truce') {
            this.setFactionRelation(factionId, 'neutral');
        }
        
        // Update UI
        this.updateDiplomacyUI();
    },
    
    // Set faction relation type directly
    setFactionRelation(factionId, relationType) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Set the new relation type
        faction.relation = relationType;
        
        // Adjust relation value to match the new type if needed
        if (relationType === 'ally' && faction.relationValue < 75) {
            faction.relationValue = 75;
        } else if (relationType === 'enemy' && faction.relationValue > 25) {
            faction.relationValue = 25;
        } else if (relationType === 'neutral' && (faction.relationValue < 25 || faction.relationValue > 75)) {
            faction.relationValue = 50;
        } else if (relationType === 'truce' && faction.relationValue < 30) {
            faction.relationValue = 30;
        }
        
        // Update UI
        this.updateDiplomacyUI();
    },
    
    // Change player reputation
    changeReputation(amount) {
        this.reputation = Math.max(0, Math.min(100, this.reputation + amount));
    },
    
    // Update treaties - check durations and effects
    updateTreaties() {
        let treatiesChanged = false;
        
        for (let i = this.treaties.length - 1; i >= 0; i--) {
            const treaty = this.treaties[i];
            
            // Decrease duration
            if (treaty.duration && treaty.duration > 0) {
            treaty.duration--;
                
                if (treaty.duration <= 0) {
                    // Treaty has expired
                    this.treaties.splice(i, 1);
                    treatiesChanged = true;
                    
                    // Notify player
                    showGameMessage(translate("Treaty expired:") + " " + translate(treaty.name));
                }
            }
        }
        
        // If treaties were changed, update UI
        if (treatiesChanged) {
            this.updateTreatiesList();
        }
        
        // Check for random diplomacy events
        this.checkRandomStorylines();
    },
    
    // Check for random storyline trigger conditions
    checkRandomStorylines() {
        // Only trigger if no active storylines
        let activeStoryline = false;
        for (const key in this.dialogThemes) {
            if (this.dialogThemes[key].active) {
                activeStoryline = true;
                break;
            }
        }
        
        if (activeStoryline) return;
        
        // Random chance to trigger a storyline (2% per update)
        if (Math.random() < 0.02) {
            this.triggerRandomStoryline();
        }
    },
    
    // Trigger a random storyline
    triggerRandomStoryline() {
        // Choose a random storyline type
        const storylineTypes = ['border_dispute', 'resource_crisis', 'ancient_relic'];
        const randomType = storylineTypes[Math.floor(Math.random() * storylineTypes.length)];
        
        // Choose a random faction based on relationships
        let potentialFactions = [];
        
        for (const factionId in this.factions) {
            const faction = this.factions[factionId];
            
            // Different storylines are more appropriate for different relationship types
            if (randomType === 'border_dispute') {
                // Border disputes work with neutral or enemy factions
                if (faction.relation === 'neutral' || faction.relation === 'enemy') {
                    potentialFactions.push(factionId);
                }
            } else if (randomType === 'resource_crisis') {
                // Resource crises work with any faction
                potentialFactions.push(factionId);
            } else if (randomType === 'ancient_relic') {
                // Ancient relic stories work best with neutral factions
                if (faction.relation === 'neutral') {
                    potentialFactions.push(factionId);
                }
            }
        }
        
        // If we have potential factions, pick one and trigger the storyline
        if (potentialFactions.length > 0) {
            const randomFactionId = potentialFactions[Math.floor(Math.random() * potentialFactions.length)];
            
            // Set up the storyline
            this.dialogThemes[randomType] = {
                active: true,
                with: randomFactionId,
                progress: 0,
                resolved: false
            };
            
            // Show notification about new storyline
            let message = "";
            const factionName = this.factions[randomFactionId].name;
            
            switch(randomType) {
                case 'border_dispute':
                    message = translate("Border tensions have arisen with") + " " + factionName;
                    break;
                case 'resource_crisis':
                    message = factionName + " " + translate("sends word of a resource crisis");
                    // Start at progress 1 to skip intro for resource crisis
                    this.dialogThemes[randomType].progress = 1;
                    break;
                case 'ancient_relic':
                    message = translate("Rumors of an ancient relic have reached") + " " + factionName;
                    break;
            }
            
            showGameMessage(message);
            
            // Save the game state
            if (typeof saveGameState === 'function') {
                saveGameState();
            }
            
            return true;
        }
        
        return false;
    },
    
    // Utility: Capitalize first letter of string
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    // Enhanced diplomacy features
    enhancedDiplomacyFeatures: {
        // New treaty types
        treatyTypes: [
            {id: 'non-aggression', name: 'Non-Aggression Pact', icon: '🤝', effects: {preventWar: true}},
            {id: 'research', name: 'Research Agreement', icon: '📚', effects: {researchBonus: 0.15}},
            {id: 'military-access', name: 'Military Access', icon: '🚶', effects: {allowTroopMovement: true}},
            {id: 'defensive', name: 'Defensive Pact', icon: '🛡️', effects: {mutualDefense: true}}
        ],
        
        // Diplomatic actions
        diplomaticActions: [
            {id: 'gift', name: 'Send Gift', relationBonus: 10, cost: {gold: 100}},
            {id: 'insult', name: 'Diplomatic Insult', relationEffect: -15},
            {id: 'tribute', name: 'Demand Tribute', relationEffect: -5, success: {resources: true}},
            {id: 'joint-war', name: 'Propose Joint War', relationEffect: 8, target: 'other_faction'}
        ]
    },
    
    // Propose non-aggression pact
    proposeNonAggression(factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Non-aggression pacts can only be proposed to neutral or truce factions
        if (faction.relation !== 'neutral' && faction.relation !== 'truce') {
            showGameMessage(`${faction.name} ile saldırmazlık paktı öneremezsiniz.`);
            return;
        }
        
        // Check if player has enough gold
        const pactCost = 30; // Gold cost for non-aggression pact
        if (!economySystem || !economySystem.hasEnoughGold(pactCost)) {
            showGameMessage(`Saldırmazlık paktı önermek için ${pactCost} altına ihtiyacınız var.`);
            return;
        }
        
        // Calculate chance of acceptance based on relation value
        const acceptanceChance = Math.min(80, faction.relationValue);
        
        // Roll for acceptance
        if (Math.random() * 100 < acceptanceChance) {
            // Accept non-aggression pact
            // Deduct gold cost using proper method
            if (!economySystem.spendGoldOnDiplomacy(pactCost, `${faction.name} ile saldırmazlık paktı`)) {
                showGameMessage(`Saldırmazlık paktı için yeterli altın kalmadı.`);
                return;
            }
            
            // Create treaty
            const nonAggressionTreaty = {
                id: `non-aggression-${factionId}-${Date.now()}`,
                type: 'non-aggression',
                name: 'Saldırmazlık Paktı',
                parties: ['player', factionId],
                duration: 15, // 15 years
                effects: {
                    preventWar: true
                },
                icon: '🤝'
            };
            
            this.treaties.push(nonAggressionTreaty);
            
            // Improve relations slightly
            this.changeFactionRelation(factionId, 8);
            
            // Show success message
            showGameMessage(`${faction.name} saldırmazlık paktı teklifinizi kabul etti!`);
        } else {
            // Reject pact but improve relations slightly anyway
            this.changeFactionRelation(factionId, 3);
            
            // Show rejection message
            showGameMessage(`${faction.name} saldırmazlık paktı teklifinizi reddetti.`);
        }
        
        // Update UI
        this.updateDiplomacyUI();
    },
    
    // Send diplomatic gift to improve relations
    sendDiplomaticGift(factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        const giftCost = 30;
        
        // Check if player has enough gold
        if (!economySystem || !economySystem.hasEnoughGold(giftCost)) {
            // Not enough gold
            showGameMessage(translate("Diplomatik hediye göndermek için yeterli altın yok"));
            return;
        }
        
        // Deduct gold using the proper method
        if (economySystem.spendGoldOnDiplomacy(giftCost, `${faction.name}'a diplomatik hediye`)) {
            // Improve relations
            this.changeFactionRelation(factionId, 10);
            
            // Show message
            showGameMessage(`${faction.name}'a ${giftCost} altın değerinde hediye gönderildi. İlişkiler iyileşti.`);
        }
    },
    
    // Request military assistance
    requestMilitaryAssistance(factionId, targetKingdomId) {
        const faction = this.factions[factionId];
        const targetKingdom = gameState.kingdoms[targetKingdomId];
        
        // Only allies can provide military assistance
        if (faction.relation !== 'ally') {
            showGameMessage(`${faction.name} must be your ally to request military assistance`);
            return false;
        }
        
        // Check for military alliance treaty
        const militaryAlliance = this.treaties.find(treaty => 
            treaty.type === 'military' && 
            treaty.parties.includes('player') && 
            treaty.parties.includes(factionId)
        );
        
        if (!militaryAlliance) {
            showGameMessage(`You need a military alliance with ${faction.name} to request assistance`);
            return false;
        }
        
        // Base success on relation value and reputation
        const successChance = (faction.relationValue * 0.6) + (this.reputation * 0.2);
        
        if (Math.random() * 100 < successChance) {
            // Send ally troops to attack the target
            this.spawnAlliedTroops(factionId, targetKingdomId);
            showGameMessage(`${faction.name} has agreed to send troops against ${targetKingdom.name}!`);
            this.changeFactionRelation(factionId, -5); // Slightly decreases relation for asking for help
            return true;
        } else {
            showGameMessage(`${faction.name} cannot spare troops at this time`);
            this.changeFactionRelation(factionId, -3);
            return false;
        }
    },
    
    // Spawn allied troops to assist player
    spawnAlliedTroops(factionId, targetKingdomId) {
        const faction = this.factions[factionId];
        const targetKingdom = gameState.kingdoms[targetKingdomId];
        
        // Find player kingdom capital or a random territory tile
        const playerKingdom = gameState.kingdoms[0];
        let spawnTile;
        
        if (playerKingdom.capital) {
            spawnTile = {x: playerKingdom.capital.x + 1, y: playerKingdom.capital.y + 1};
        } else {
            // Find any player territory
            const territoryTiles = [];
            for (let y = 0; y < MAP_SIZE; y++) {
                for (let x = 0; x < MAP_SIZE; x++) {
                    if (gameState.map[y][x].territory === 0) {
                        territoryTiles.push({x, y});
                    }
                }
            }
            
            if (territoryTiles.length > 0) {
                spawnTile = territoryTiles[Math.floor(Math.random() * territoryTiles.length)];
            } else {
                // Fallback to player position
                spawnTile = {x: gameState.player.x + 1, y: gameState.player.y + 1};
            }
        }
        
        // Spawn 3-6 allied troops
        const troopCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < troopCount; i++) {
            // Offset spawn position slightly
            const offsetX = spawnTile.x + (Math.random() * 2 - 1);
            const offsetY = spawnTile.y + (Math.random() * 2 - 1);
            
            const troopX = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(offsetX)));
            const troopY = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(offsetY)));
            
            // Create allied troop
            const alliedTroop = {
                id: generateEnemyId(), // Add unique ID
                x: troopX,
                y: troopY,
                health: 75,
                attack: 8,
                type: 'WARRIOR',
                kingdomId: -1, // -1 indicates allied troop
                isAllied: true,
                allyFactionId: factionId,
                targetKingdomId: targetKingdomId,
                moveDelay: 350,
                lastMoved: 0,
                attackPath: null,
                attackPathIndex: 0,
                isAggressive: true,
                isTargetingPlayer: false,
                color: faction.color
            };
            
            gameState.enemies.push(alliedTroop);
        }
        
        showGameMessage(`${troopCount} allied troops from ${faction.name} have arrived!`);
    }
};

// Add CSS for dialog system
document.addEventListener('DOMContentLoaded', function() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .diplomacy-dialog {
            display: none;
            position: absolute;
            width: 80%;
            max-width: 500px;
            background-color: #2c3e50;
            border: 3px solid #d4af37;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
            z-index: 1000;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
        }
        
        .dialog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background-color: #1c2e40;
            border-bottom: 2px solid #d4af37;
            border-radius: 7px 7px 0 0;
        }
        
        .dialog-header h3 {
            margin: 0;
            font-size: 1.2rem;
            color: #d4af37;
        }
        
        .dialog-content {
            padding: 15px;
        }
        
        .faction-portrait {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .large-faction-icon {
            font-size: 3rem;
            background-color: #34495e;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #d4af37;
        }
        
        .dialog-message-container {
            background-color: #34495e;
            border: 1px solid #456789;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .dialog-message {
            margin: 0;
            font-style: italic;
            line-height: 1.4;
        }
        
        .dialog-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .dialog-option {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: bold;
        }
        
        .dialog-option:hover {
            background-color: #2980b9;
        }
        
        .dialog-option[data-option="ceasefire"] {
            background-color: #27ae60;
        }
        
        .dialog-option[data-option="ceasefire"]:hover {
            background-color: #219653;
        }
        
        .dialog-option[data-option="close"] {
            background-color: #7f8c8d;
        }
        
        .dialog-option[data-option="close"]:hover {
            background-color: #6c7a7b;
        }
    `;
    document.head.appendChild(styleEl);
});

// Add diplomacy initialization to window load
window.addEventListener('load', () => {
    diplomacySystem.init();
     
});

// Export the diplomacy system
window.diplomacySystem = diplomacySystem; 

// AI Kingdom Relations System
diplomacySystem.aiKingdomRelations = {};

// Initialize AI kingdom relations
diplomacySystem.initializeAIKingdomRelations = function() {
    // Reset kingdom relations
    this.aiKingdomRelations = {};
    
    // Get all kingdom IDs
    const kingdomIds = Object.keys(gameState.kingdoms).map(key => parseInt(key));
    
    // For each pair of kingdoms, establish a relation
    for (let i = 0; i < kingdomIds.length; i++) {
        for (let j = i + 1; j < kingdomIds.length; j++) {
            const k1 = kingdomIds[i];
            const k2 = kingdomIds[j];
            
            // Skip if player kingdom (kingdom 0)
            if (k1 === 0 || k2 === 0) continue;
            
            // Create a unique key for this relationship
            const relationKey = `${k1}-${k2}`;
            
            // Random initial relation value (30-70 out of 100)
            const initialRelation = 30 + Math.floor(Math.random() * 40);
            
            // Determine relation type based on value
            let relationType = 'neutral';
            if (initialRelation < 30) relationType = 'enemy';
            else if (initialRelation > 70) relationType = 'ally';
            
            // Set up relation
            this.aiKingdomRelations[relationKey] = {
                kingdoms: [k1, k2],
                relationValue: initialRelation,
                relationType: relationType,
                atWar: false,
                lastInteraction: 0,
                treaties: [] // Non-aggression pacts, alliances, etc.
            };
        }
    }
    
    console.log("AI Kingdom relations initialized:", this.aiKingdomRelations);
};

// Get relation between two AI kingdoms
diplomacySystem.getKingdomRelation = function(kingdom1, kingdom2) {
    // Make sure kingdom1 is the smaller ID
    const k1 = Math.min(kingdom1, kingdom2);
    const k2 = Math.max(kingdom1, kingdom2);
    
    // Create relation key
    const relationKey = `${k1}-${k2}`;
    
    // Return relation or default
    return this.aiKingdomRelations[relationKey] || {
        kingdoms: [k1, k2],
        relationValue: 50,
        relationType: 'neutral',
        atWar: false,
        lastInteraction: 0,
        treaties: []
    };
};

// Change relation between two AI kingdoms
diplomacySystem.changeAIKingdomRelation = function(kingdom1, kingdom2, amount) {
    // Make sure kingdom1 is the smaller ID
    const k1 = Math.min(kingdom1, kingdom2);
    const k2 = Math.max(kingdom1, kingdom2);
    
    // Create relation key
    const relationKey = `${k1}-${k2}`;
    
    // Get current relation
    const relation = this.aiKingdomRelations[relationKey];
    if (!relation) return;
    
    // Update relation value
    relation.relationValue = Math.max(0, Math.min(100, relation.relationValue + amount));
    
    // Update relation type
    if (relation.relationValue < 30) relation.relationType = 'enemy';
    else if (relation.relationValue > 70) relation.relationType = 'ally';
    else relation.relationType = 'neutral';
};

// Declare war between AI kingdoms
diplomacySystem.declareAIKingdomWar = function(kingdom1, kingdom2) {
    // Make sure kingdom1 is the smaller ID
    const k1 = Math.min(kingdom1, kingdom2);
    const k2 = Math.max(kingdom1, kingdom2);
    
    // Create relation key
    const relationKey = `${k1}-${k2}`;
    
    // Get current relation
    const relation = this.aiKingdomRelations[relationKey];
    if (!relation) return;
    
    // Set to war status
    relation.atWar = true;
    relation.relationType = 'enemy';
    relation.relationValue = Math.max(0, relation.relationValue - 30);
    
    // Get kingdom names for message
    const kingdom1Name = gameState.kingdoms[k1]?.name || `Kingdom ${k1}`;
    const kingdom2Name = gameState.kingdoms[k2]?.name || `Kingdom ${k2}`;
    
    // Show message about the war using the warfare notification system
    if (window.showWarDeclarationMessage) {
        showWarDeclarationMessage(kingdom1Name, kingdom2Name);
    } else if (window.showKingdomMessage) {
        // Use the kingdom message function
        showKingdomMessage(`${kingdom1Name} has declared war against ${kingdom2Name}!`, 2);
    } else {
        // Fallback to regular game message
        showGameMessage(`${kingdom1Name} has declared war against ${kingdom2Name}!`);
    }
    
    // Remove peacetime treaties
    relation.treaties = relation.treaties.filter(t => t.type !== 'peace' && t.type !== 'alliance');
};

// Make peace between AI kingdoms
diplomacySystem.makeAIKingdomPeace = function(kingdom1, kingdom2) {
    // Make sure kingdom1 is the smaller ID
    const k1 = Math.min(kingdom1, kingdom2);
    const k2 = Math.max(kingdom1, kingdom2);
    
    // Create relation key
    const relationKey = `${k1}-${k2}`;
    
    // Get current relation
    const relation = this.aiKingdomRelations[relationKey];
    if (!relation) return;
    
    // Set to peace status
    relation.atWar = false;
    
    // Add a peace treaty
    relation.treaties.push({
        type: 'peace',
        duration: 20 + Math.floor(Math.random() * 10), // 20-30 years
        startYear: gameState.gameYear
    });
    
    // Improve relations slightly
    relation.relationValue = Math.min(100, relation.relationValue + 10);
    
    // Get kingdom names for message
    const kingdom1Name = gameState.kingdoms[k1]?.name || `Kingdom ${k1}`;
    const kingdom2Name = gameState.kingdoms[k2]?.name || `Kingdom ${k2}`;
    
    // Show message about the peace using the warfare notification system
    if (window.showPeaceTreatyMessage) {
        showPeaceTreatyMessage(kingdom1Name, kingdom2Name);
    } else if (window.showKingdomMessage) {
        // Use the kingdom message function
        showKingdomMessage(`${kingdom1Name} and ${kingdom2Name} have agreed to peace!`);
    } else {
        // Fallback to regular game message
        showGameMessage(`${kingdom1Name} and ${kingdom2Name} have agreed to peace!`);
    }
};

// Update AI kingdom relations periodically
diplomacySystem.updateAIKingdomRelations = function() {
    // Skip if not enough time has passed
    if (!gameState.gameYear || Math.random() > 0.1) return;
    
    // For each kingdom relation
    Object.keys(this.aiKingdomRelations).forEach(relationKey => {
        const relation = this.aiKingdomRelations[relationKey];
        
        // Skip recent interactions
        if (gameState.gameYear - relation.lastInteraction < 5) return;
        
        // Update last interaction time
        relation.lastInteraction = gameState.gameYear;
        
        // Check and remove expired treaties
        relation.treaties = relation.treaties.filter(treaty => {
            return (treaty.startYear + treaty.duration) > gameState.gameYear;
        });
        
        // Chance of war declaration if enemies
        if (!relation.atWar && relation.relationType === 'enemy' && Math.random() < 0.3) {
            // No peace treaty preventing war
            const hasPeaceTreaty = relation.treaties.some(t => t.type === 'peace');
            if (!hasPeaceTreaty) {
                this.declareAIKingdomWar(relation.kingdoms[0], relation.kingdoms[1]);
            }
        }
        
        // Chance of peace if at war for too long
        else if (relation.atWar && Math.random() < 0.15) {
            this.makeAIKingdomPeace(relation.kingdoms[0], relation.kingdoms[1]);
        }
        
        // Random relation drift
        const relationDrift = Math.random() < 0.5 ? -2 : 2;
        this.changeAIKingdomRelation(relation.kingdoms[0], relation.kingdoms[1], relationDrift);
    });
};

// Add to the init method to initialize AI kingdom relations
const originalInit = diplomacySystem.init;
diplomacySystem.init = function(resetToDefaults = false) {
    originalInit.call(this, resetToDefaults);
    this.initializeAIKingdomRelations();
};

// Update original declareWar function to use kingdom messages for player war declarations
const originalDeclareWar = diplomacySystem.declareWar;
diplomacySystem.declareWar = function(factionId) {
    // Call the original function
    originalDeclareWar.call(this, factionId);
    
    // Get faction name
    const faction = this.factions[factionId];
    if (!faction) return;
    
    // Use kingdom message for war declarations
    if (window.showKingdomMessage) {
        showKingdomMessage(`You have declared war against ${faction.name}!`, 2);
    }
};

// Update proposeAlliance to use kingdom messages
const originalProposeAlliance = diplomacySystem.proposeAlliance;
diplomacySystem.proposeAlliance = function(factionId) {
    // Store result of original function call
    const result = originalProposeAlliance.call(this, factionId);
    
    // Get faction
    const faction = this.factions[factionId];
    if (!faction) return result;
    
    // Find alliance treaty to check if it was successful
    const allianceTreaty = this.treaties.find(treaty => 
        treaty.type === 'alliance' && 
        treaty.parties.includes('player') && 
        treaty.parties.includes(factionId)
    );
    
    // If alliance was formed, show kingdom message
    if (allianceTreaty && window.showKingdomMessage) {
        showKingdomMessage(`You have formed an alliance with ${faction.name}!`, 2);
    }
    
    return result;
};

// Update offerCeasefire to use kingdom messages when successful
const originalOfferCeasefire = diplomacySystem.offerCeasefire;
diplomacySystem.offerCeasefire = function(factionId) {
    // Store original treaties count
    const originalTreatyCount = this.treaties.length;
    
    // Call original function
    const result = originalOfferCeasefire.call(this, factionId);
    
    // Get faction
    const faction = this.factions[factionId];
    if (!faction) return result;
    
    // Check if a new treaty was added
    if (this.treaties.length > originalTreatyCount && window.showKingdomMessage) {
        // Find the ceasefire treaty
        const ceasefireTreaty = this.treaties.find(treaty => 
            treaty.type === 'ceasefire' && 
            treaty.parties.includes('player') && 
            treaty.parties.includes(factionId) &&
            treaty.startDate === Math.floor(gameState.gameYear)
        );
        
        if (ceasefireTreaty) {
            const duration = ceasefireTreaty.duration || "several";
            showKingdomMessage(`${faction.name} has accepted your ceasefire offer for ${duration} years!`, 2);
        }
    }
    
    return result;
};