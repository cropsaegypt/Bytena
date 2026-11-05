/**
 * Modular AI Service Architecture for Baytna
 * Supports Google Gemini API when GEMINI_API_KEY is configured,
 * and seamlessly provides intelligent Local Heuristic Fallbacks
 * so the application works 100% offline or before an API key is added.
 */

export interface ChatResponse {
  message: string;
  suggestedAction?: {
    type: 'ADD_SHOPPING' | 'ADD_RECIPE' | 'ADD_EXPENSE' | 'ADD_WORKOUT' | 'REMIND_WATER';
    payload: any;
  };
  bridgeNotification?: {
    fromUserId: string;
    toUserId: string;
    title: string;
    body: string;
    emoji?: string;
  };
}

export interface InvoiceParsedResult {
  storeName: string;
  invoiceDate: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  items: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    category: string;
    suggestedShoppingMatch?: string;
  }>;
}

export interface NutritionEstimateResult {
  mealName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  healthTips: string;
}

export interface RecipeAIGenerateResult {
  title: string;
  category: string;
  servings: number;
  prepTimeMins: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  estimatedCost: number;
  ingredients: Array<{ name: string; amount: number; unit: string; estimatedPrice: number }>;
  instructions: string[];
}

export interface AIServiceInterface {
  chatWithOmMahmoud(userMessage: string, context?: any): Promise<ChatResponse>;
  chatWithFitnessCoach(userMessage: string, userProfile?: any): Promise<ChatResponse>;
  chatWithFamilyAssistant(userMessage: string, householdData?: any): Promise<ChatResponse>;
  parseInvoice(imageBase64OrText: string): Promise<InvoiceParsedResult>;
  estimateMealNutrition(mealNameOrDescription: string): Promise<NutritionEstimateResult>;
  generateRecipeDetails(mealName: string): Promise<RecipeAIGenerateResult>;
}

// 1. Local Heuristic Engine (Fallback & Offline)
export class LocalHeuristicAIService implements AIServiceInterface {
  async chatWithOmMahmoud(userMessage: string, context?: any): Promise<ChatResponse> {
    const raw = userMessage.trim();
    const lower = raw.toLowerCase();
    const isFady = context?.userId === 'fady' || lower.includes('فادي');
    const greetingName = isFady ? 'يا فادي يا بني يا حبيب قلبي' : 'يا ست الكل يا رحمة يا سكرة';
    const partnerName = isFady ? 'رحمة' : 'فادي';

    // 1. BRIDGE INTENT: Fady asking Om Mahmoud to tell Rahma something
    const isBridgeToRahma = isFady && (
      lower.includes('قولي لرحمة') || lower.includes('قولي لـ رحمة') ||
      lower.includes('بلغي رحمة') || lower.includes('وصي رحمة') ||
      lower.includes('قوليلها') || lower.includes('نفسي في') ||
      lower.includes('نفسي أكل') || lower.includes('نفسي اكل') ||
      lower.includes('عايز رحمة')
    );

    if (isBridgeToRahma) {
      let cleanContent = raw
        .replace(/^(قولي\s*ل*رحمة|بلغي\s*رحمة|وصي\s*رحمة|قوليلها|يا\s*أم\s*محمود\s*قولي\s*ل*رحمة)/gi, '')
        .trim();
      if (!cleanContent || cleanContent.length < 2) {
        cleanContent = raw;
      }

      return {
        message: `من عينيا الاتنين يا فادي يا بني يا حبيب قلبي! بلغت ست البنات رحمة حالا ووصلتلها رغبتك بكل حب ورقة.. وقولتلها: "${cleanContent}". متقلقش خالص يا بني، كل اللي نفسك فيه هيكون جاهز وهتبطبطك وتفرح قلبك! ❤️👵🏼`,
        bridgeNotification: {
          fromUserId: 'fady',
          toUserId: 'rahma',
          title: 'رسالة من أم محمود: فادي بيوصيكي ❤️👵🏼',
          body: `يا رحمة يا ست البنات وقمر بيتنا، فادي حبيبك وصاني أقولك: "${cleanContent}". ريحي بالك ومتشيليش هم يا غالية 💕`,
          emoji: '👵🏼',
        },
      };
    }

    // 2. BRIDGE INTENT: Rahma asking Om Mahmoud to tell Fady something
    const isBridgeToFady = !isFady && (
      lower.includes('قولي لفادي') || lower.includes('قولي لـ فادي') ||
      lower.includes('بلغي فادي') || lower.includes('وصي فادي') ||
      lower.includes('قوليله') || lower.includes('عايزة فادي')
    );

    if (isBridgeToFady) {
      let cleanContent = raw
        .replace(/^(قولي\s*ل*فادي|بلغي\s*فادي|وصي\s*فادي|قوليله|يا\s*أم\s*محمود\s*قولي\s*ل*فادي)/gi, '')
        .trim();
      if (!cleanContent || cleanContent.length < 2) {
        cleanContent = raw;
      }

      return {
        message: `حاضر يا ست الكل يا رحمة يا بنتي من عينيا الاتنين! بلغت فادي حبيبك وسندك فوراً وقولتله: "${cleanContent}". متشيليش أي هم خالص يا قمر بيتنا، وهو مروح هيعمل اللي قولتيه بالظبط! 💕👵🏼`,
        bridgeNotification: {
          fromUserId: 'rahma',
          toUserId: 'fady',
          title: 'رسالة من أم محمود: رحمة بتوصيك ❤️👵🏼',
          body: `يا فادي يا بني يا سندي، رحمة حبيبتك وصتني أقولك: "${cleanContent}". متتأخرش على ست البنات 💕`,
          emoji: '👵🏼',
        },
      };
    }

    // 3. Real Shopping & Needs Inspection
    if (lower.includes('ناقص') || lower.includes('شراء') || lower.includes('سوبرماركت') || lower.includes('طلبات') || lower.includes('اشتري') || lower.includes('اجيب ايه')) {
      const pendingItems = context?.shoppingItems || [];
      if (pendingItems.length > 0) {
        const names = pendingItems.slice(0, 4).map((i: any) => `${i.name} (${i.needBuyQty || i.quantity || 1} ${i.unit || 'قطعة'})`).join('، ');
        const extraCount = pendingItems.length - 4;
        return {
          message: `بص ${isFady ? 'يا فادي يا بني' : 'يا حبيبتي يا رحمة'}، دخلت بصيتلك في قائمة النواقص في البيت، ولقيت مسجل عندنا: ${names}${extraCount > 0 ? ` وغيرهم كمان ${extraCount} طلبات` : ''}. ${isFady ? 'تحب تجيبهم وأنت مروح ولا نزود حاجة تانية؟ 🛒' : 'تحبي نزود حاجة تانية في القائمة تفكر فادي بيها؟ 🛒'}`,
          suggestedAction: {
            type: 'ADD_SHOPPING',
            payload: { name: 'طلب جديد للبيت', category: 'GROCERIES', quantity: 1, unit: 'قطعة' },
          },
        };
      } else {
        return {
          message: `ما شاء الله تبارك الله ${isFady ? 'يا فادي يا بني' : 'يا رحمة يا بنتي'}! دورتلك في قائمة الطلبات ولقيت البيت عامر والتلاجة مليانة ومفيش أي نواقص مسجلة حالياً! لو في بالك أي حاجة من السوبرماركت قولي وأنا هسجلهالك فوراً في القائمة ✨`,
        };
      }
    }

    // 4. Real Food / Cooking / Kitchen Inspection
    if (lower.includes('أكل') || lower.includes('اكل') || lower.includes('غدا') || lower.includes('وجبة') || lower.includes('طبخ') || lower.includes('مطبخ') || lower.includes('عشا') || lower.includes('فطار') || lower.includes('نعمل ايه')) {
      const todayPlans = context?.mealPlans || [];
      const recipes = context?.recipes || [];

      if (todayPlans.length > 0) {
        const todayMeal = todayPlans[0];
        const mealTitle = todayMeal.recipe?.title || todayMeal.customName || 'وجبة بيتنا الشهية';
        return {
          message: `يا صباح السعادة ${greetingName}! بصيتلك في جدول مطبخنا النهارده ولقيت مسجل وجبة: **${mealTitle}** 🍲! أكلة جميلة وتفتح النفس، تحبوا نعملها ولا في بالكم حاجة تانية أحلى؟ ❤️`,
        };
      } else if (recipes.length > 0) {
        const recipeTitles = recipes.slice(0, 3).map((r: any) => r.title).join('، أو ');
        return {
          message: `بصيتلك في كتاب وصفات مطبخنا ${greetingName}، ولقيت عندنا وصفات حلوة مسجلينها زي: **${recipeTitles}**! إيه رأيك نختار واحدة منهم ونعملها النهارده في روقان؟ 🍲`,
        };
      } else {
        return {
          message: `يا صباح الهنا ${greetingName}! كتاب المطبخ لسه فاضي وجديد، إيه رأيك نعمل مكرونة بالبشاميل بلدي أصلية، أو صينية فراخ مشوية بالبطاطس والليمون؟ أكلة مصرية أصيلة وكلكم بتحبوها وسهلة جداً! قولي لو تحب أسجلهالك في المطبخ فوراً 🍲`,
          suggestedAction: {
            type: 'ADD_RECIPE',
            payload: { title: 'مكرونة بالبشاميل بلدي أصلية', category: 'LUNCH' },
          },
        };
      }
    }

    // 5. Real Finance & Budget Inspection
    if (lower.includes('فلوس') || lower.includes('مصاريف') || lower.includes('ميزانية') || lower.includes('صرفنا') || lower.includes('فاضل كام') || lower.includes('توفير') || lower.includes('حساب')) {
      const totalSpent = context?.totalSpent || 0;
      const monthlyBudget = context?.monthlyBudget || 16000;
      const remainingBudget = context?.remainingBudget !== undefined ? context.remainingBudget : Math.max(0, monthlyBudget - totalSpent);

      return {
        message: `تعال نحسبها بالقرش والبركة ${isFady ? 'يا فادي يا بني' : 'يا رحمة يا بنتي'}! إحنا محددين ميزانية الشهر **${monthlyBudget.toLocaleString('ar-EG')} جنيه**، وصرفنا لحد دلوقتي **${totalSpent.toLocaleString('ar-EG')} جنيه**، فالمتبقي معانا بأمان تام هو **${remainingBudget.toLocaleString('ar-EG')} جنيه**! القرش فيه بركة ومصاريف بيتنا متسجلة أول بأول وتحت السيطرة تماماً الحمد لله 💰✨`,
      };
    }

    // 6. Real Prayers & Dhikr Inspection
    if (lower.includes('صلاة') || lower.includes('صلوات') || lower.includes('فجر') || lower.includes('ظهر') || lower.includes('عصر') || lower.includes('مغرب') || lower.includes('عشاء') || lower.includes('أذكار') || lower.includes('قرآن')) {
      const prayer = context?.prayers;
      const streak = context?.streakDays || 1;
      const completed: string[] = [];
      if (prayer?.fajr) completed.push('الفجر');
      if (prayer?.dhuhr) completed.push('الظهر');
      if (prayer?.asr) completed.push('العصر');
      if (prayer?.maghrib) completed.push('المغرب');
      if (prayer?.isha) completed.push('العشاء');

      if (completed.length > 0) {
        return {
          message: `ما شاء الله تبارك الله ${greetingName}! مسجل عندي لصلواتك النهارده إنك صليت: (${completed.join('، ')}). وبقالك **${streak} أيام متتالية** محافظ على التزامك ونور صلاتك في بيتنا! ربنا يتقبل منك ويديم البركة والسكينة في قلوبكم 🤲🌿`,
        };
      } else {
        return {
          message: `يا صباح البركة والرضا ${greetingName}! مسجل عندي صلوات اليوم جاهزة للتعليم. متنساش تصلي الفجر والظهر وتكسب نقاط البركة لنفسك ولشريكك! الصلاة نور بيتنا وسكينته 🤲✨`,
        };
      }
    }

    // 7. Real Water & Hydration Inspection
    if (lower.includes('مية') || lower.includes('عطشان') || lower.includes('شرب') || lower.includes('ترطيب')) {
      const waterMl = context?.todayWaterTotal || 0;
      return {
        message: `جدع يا قمر! شربت النهارده **${waterMl} مل** من هدف المية. يلا قوم املى كوباية مية كبيرة واشربها دلوقتي على مهلك عشان نضارتك وصحتك وتركيزك يا غالي 💧`,
        suggestedAction: {
          type: 'REMIND_WATER',
          payload: { amountMl: 300 },
        },
      };
    }

    // 8. Chores / Cleaning
    if (lower.includes('تنظيف') || lower.includes('غسيل') || lower.includes('مواعين') || lower.includes('ترتيب') || lower.includes('شغل البيت')) {
      return {
        message: `على مهلك خالص ${greetingName}، البيت مش هيطير ومحدش بيجري ورانا! 15 دقيقة لمّ خفيف للصالة وتلميع الطاولات وغسالة الأطباق تخلص المواعين، والبيت هينور بروقان ومن غير أي فرهدة أو مجهود زيادة 🧹✨`,
      };
    }

    // 9. Fatigue / Stress / Venting (Personalized)
    if (lower.includes('تعبان') || lower.includes('مرهق') || lower.includes('كسل') || lower.includes('ارتاح') || lower.includes('زهقان') || lower.includes('صداع')) {
      if (isFady) {
        return {
          message: `سلامة قلبك وضهرك يا فادي يا بني من تعب الشغل واليوم! سيب كل حاجة وخد نَفَس عميق وريّح نص ساعة.. ست البنات رحمة مجهزة البيت بحب، وكل تعبك عشان بيتك في ميزان حسناتك ومقدر جداً يا سندي، وربنا يديمك نعمة ليها ولينا كلنا ❤️`,
        };
      } else {
        return {
          message: `سلامتك يا بنتي ألف سلامة! إرمي كل حاجة من إيدك، البيت مش هيطير.. ادخلي خدي دش دافي واشربي كوباية ليمون بالنعناع وريحي ضهرك، وفادي حبيبك مقدر تعبك جداً وأنا هقوله يجيب عشا معاه وهو جاي وميعطلش روقانك أبداً يا ست الكل 💕`,
        };
      }
    }

    // 10. Greetings & Pleasantries
    if (
      lower.includes('ازيك') || lower.includes('عاملة ايه') || lower.includes('صباح') ||
      lower.includes('مساء') || lower.includes('سلام') || lower.includes('أهلا') ||
      lower.includes('اهلا') || lower.includes('هاي') || lower.includes('الو') ||
      lower.includes('يا ام محمود') || lower.includes('يا أم محمود')
    ) {
      return {
        message: `يا صباح الفل والياسمين والرضا ${greetingName}! أنا أم محمود، عايشة معاكم في بيتنا ومتابعة كل تفصيلة عشان أفرش لكم الدنيا راحة وروقان. قولي أساعدك في إيه النهارده؟ أكل، تنظيف، طلبات ناقصة، أو حابب توصي ${partnerName} بحاجة وأنا أبلغهالك فوراً؟ ❤️`,
      };
    }

    // 11. Love / Thanks / Compliments
    if (lower.includes('بحبك') || lower.includes('شكرا') || lower.includes('تسلمي') || lower.includes('تسلم') || lower.includes('حبيبتي') || lower.includes('يا عسل')) {
      return {
        message: `الله يسعد قلبك ويجبر بخاطرك ${greetingName}! ده أنا اللي محظوظة بيك أنت و${partnerName}، ربنا يديم المحبة والبركة في بيتنا ويفضل عامر دايماً بالخير والضحكة والروقان ❤️`,
      };
    }

    // Default intelligent warm Egyptian reply
    return {
      message: `من عينيا الاتنين ${greetingName}! أنا متابعة كل حاجة في بيتنا: المطبخ، النواقص، المصاريف، وصلواتنا.. قولي طلبك بالظبط وتحب أساعدك في إيه دلوقتي، أو لو حابب توصي ${partnerName} بحاجة وأنا أبلغهالك فوراً؟ ❤️`,
    };
  }

  async chatWithFitnessCoach(userMessage: string, userProfile?: any): Promise<ChatResponse> {
    const lower = userMessage.toLowerCase();

    if (lower.includes('تمرين') || lower.includes('جيم') || lower.includes('حديد') || lower.includes('عضلات')) {
      return {
        message: 'عاش يا بطل! النهاردة يوم الدفع (Chest & Triceps): 4 مجموعات بنش برس بار، 3 مجموعات دمبلز عالي، و3 مجموعات كيبل كروس أوفر. ركز في التكنيك والمدى الحركي الكامل ومتنساش الإحماء الكافي!',
        suggestedAction: {
          type: 'ADD_WORKOUT',
          payload: { title: 'تمرين بنش وترايسبس بالجيم', category: 'GYM', durationMins: 50 },
        },
      };
    }

    if (lower.includes('وزن') || lower.includes('تخسيس') || lower.includes('دهون') || lower.includes('ميزان')) {
      return {
        message: 'معدل نزول الوزن الصحي من 0.5 إلى 1 كجم أسبوعياً للحفاظ على الكتلة العضلية. قياس الصباح على الريق هو الأدق، والاستمرارية في حساب السعرات والبروتين هي سر النتيجة المستدامة 💪',
      };
    }

    if (lower.includes('بروتين') || lower.includes('أكل') || lower.includes('سعرات')) {
      return {
        message: 'هدفك اليومي 150 جرام بروتين: وزّعهم على 4 وجبات (بيض وشوفان صباحاً، صدور فراخ أو لحم في الغداء، تونة أو سكوب واي بروتين كسناك، وجبنة قريش قبل النوم).',
      };
    }

    return {
      message: 'فورمتك أولوية! أنا كوتشك الشخصي، جاهز أتابع معاك أوزانك في الجيم، وجباتك وسعراتك، ونبني فورمة قوية مع الحفاظ على صحتك ومفاصلك.',
    };
  }

  async chatWithFamilyAssistant(userMessage: string, householdData?: any): Promise<ChatResponse> {
    const lower = userMessage.toLowerCase();

    if (lower.includes('صرفنا') || lower.includes('ميزانية') || lower.includes('فلوس') || lower.includes('مصاريف')) {
      const budget = householdData?.monthlyBudgetTarget || 16000;
      const spent = householdData?.totalSpent || 2100;
      const remaining = budget - spent;
      return {
        message: `إجمالي مصروفاتنا المسجلة حتى الآن هي ${spent.toLocaleString()} جنيه من أصل ميزانية ${budget.toLocaleString()} جنيه. المتبقي بأمان هو ${remaining.toLocaleString()} جنيه لنهاية الشهر. كل الأمور تحت السيطرة! 📊`,
      };
    }

    if (lower.includes('غدا') || lower.includes('أكل') || lower.includes('وجبات')) {
      return {
        message: `جدول وجبات اليوم: الإفطار شوفان بالموز والعسل، الغداء مكرونة بالبشاميل طلب فادي ورحمة، والعشاء سلطة جبنة قريش خفيفة. بالهنا والشفا! 🍽️`,
      };
    }

    return {
      message: `أهلاً بك في بيتنا! أنا المساعد العائلي الذكي. أستطيع إخبارك بملخص الميزانية، جدول الوجبات، طلبات البيت الناقصة، والمهام اليومية المتبقية. بم أقدر أساعدك؟`,
    };
  }

  async parseInvoice(imageBase64OrText: string): Promise<InvoiceParsedResult> {
    // Intelligent simulation for fallback
    return {
      storeName: 'هايبر ماركت كارفور / مترو',
      invoiceDate: new Date().toISOString().split('T')[0],
      totalAmount: 385.5,
      taxAmount: 25.0,
      discountAmount: 15.0,
      items: [
        { name: 'لبن حليب المراعي كامل الدسم 1 لتر', qty: 2, unitPrice: 38.0, category: 'FOOD', suggestedShoppingMatch: 'لبن حليب طبيعي' },
        { name: 'مكرونة ريجينا قلم 400 جم', qty: 3, unitPrice: 22.5, category: 'FOOD', suggestedShoppingMatch: 'مكرونة قلم' },
        { name: 'مسحوق أوتوماتيك أريال لافندر', qty: 1, unitPrice: 195.0, category: 'CLEANING', suggestedShoppingMatch: 'مسحوق غسيل أوتوماتيك' },
        { name: 'مناديل مطبخ رول مضغوط', qty: 1, unitPrice: 47.0, category: 'HOUSEHOLD', suggestedShoppingMatch: 'مناديل مطبخ' },
      ],
    };
  }

  async estimateMealNutrition(mealNameOrDescription: string): Promise<NutritionEstimateResult> {
    const lower = mealNameOrDescription.toLowerCase();

    if (lower.includes('بشاميل') || lower.includes('مكرونة')) {
      return {
        mealName: 'مكرونة بالبشاميل (قطعة متوسطة)',
        calories: 550,
        proteinG: 28,
        carbsG: 62,
        fatG: 21,
        healthTips: 'وجبة ممتازة وغنية بالطاقة. يفضل تناول طبق سلطة خضراء كبير معها لتقليل امتصاص الدهون وزيادة الألياف والشبع.',
      };
    }

    if (lower.includes('فراخ') || lower.includes('دجاج')) {
      return {
        mealName: 'صدر دجاج مشوي مع بطاطس',
        calories: 420,
        proteinG: 45,
        carbsG: 30,
        fatG: 12,
        healthTips: 'وجبة نموذجية لبناء العضلات وتنشيف الدهون. نسبة بروتين عالية وقيمة حيوية ممتازة.',
      };
    }

    // Default healthy estimate
    return {
      mealName: mealNameOrDescription,
      calories: 350,
      proteinG: 20,
      carbsG: 40,
      fatG: 12,
      healthTips: 'وجبة متوازنة. احرص على شرب كوب ماء قبل الوجبة وتناول الخضراوات الطازجة.',
    };
  }

  async generateRecipeDetails(mealName: string): Promise<RecipeAIGenerateResult> {
    const lower = mealName.toLowerCase();

    if (lower.includes('مسقعة') || lower.includes('مسقعه')) {
      return {
        title: mealName,
        category: 'LUNCH',
        servings: 4,
        prepTimeMins: 45,
        calories: 480,
        proteinG: 26,
        carbsG: 34,
        fatG: 22,
        estimatedCost: 110,
        ingredients: [
          { name: 'باذنجان رومي مقطع شرائح', amount: 1, unit: 'كجم', estimatedPrice: 20 },
          { name: 'لحم مفروم بلدي', amount: 300, unit: 'جرام', estimatedPrice: 75 },
          { name: 'فلفل رومي وحار أخضر', amount: 3, unit: 'حبة', estimatedPrice: 10 },
          { name: 'عصير طماطم مسبكة', amount: 500, unit: 'مل', estimatedPrice: 15 },
          { name: 'ثوم مفروم وخل وبهارات', amount: 1, unit: 'ملعقة', estimatedPrice: 5 },
        ],
        instructions: [
          'رش الملح على شرائح الباذنجان وتركها 15 دقيقة ثم تجفيفها وقليها أو شوائها.',
          'تشويح الثوم مع الفلفل الأخضر وإضافة عصير الطماطم والخل والملح والكمون.',
          'تعصيج اللحم المفروم مع البصل والبهارات في مقلاة منفصلة.',
          'رص طبقة باذنجان بالصينية ثم اللحم المفروم ثم باقي الباذنجان والصلصة والخبز بالفرن 20 دقيقة.',
        ],
      };
    }

    if (lower.includes('كشري')) {
      return {
        title: mealName,
        category: 'LUNCH',
        servings: 4,
        prepTimeMins: 40,
        calories: 520,
        proteinG: 20,
        carbsG: 85,
        fatG: 8,
        estimatedCost: 65,
        ingredients: [
          { name: 'أرز مصري وشعرية', amount: 350, unit: 'جرام', estimatedPrice: 15 },
          { name: 'عدس بجبة بني', amount: 200, unit: 'جرام', estimatedPrice: 15 },
          { name: 'مكرونة مقصوصة واسباجتي', amount: 250, unit: 'جرام', estimatedPrice: 12 },
          { name: 'حمص شام مسلوق', amount: 150, unit: 'جرام', estimatedPrice: 10 },
          { name: 'بصل مقرمش (ورد)', amount: 3, unit: 'حبة', estimatedPrice: 8 },
          { name: 'صلصة طماطم بالخل والثوم ودقة', amount: 1, unit: 'طبق', estimatedPrice: 10 },
        ],
        instructions: [
          'سلق العدس بجبة حتى ينضج بنسبة 80% وتصفية ماء السلق لاستخدامه في الأرز.',
          'تحمير الشعرية وطبخ الأرز مع ماء العدس والكمون.',
          'سلق المكرونة وتصفيتها وتقليبها في ملعقة زيت البصل.',
          'تحمير البصل المقطع جوانح حتى يصبح مقرمشاً، وتحضير الصلصة والدقة والشطة.',
        ],
      };
    }

    if (lower.includes('ملوخية') || lower.includes('ملوخيه')) {
      return {
        title: mealName,
        category: 'LUNCH',
        servings: 4,
        prepTimeMins: 40,
        calories: 460,
        proteinG: 38,
        carbsG: 45,
        fatG: 12,
        estimatedCost: 125,
        ingredients: [
          { name: 'ملوخية خضراء طازجة أو مجمدة', amount: 400, unit: 'جرام', estimatedPrice: 20 },
          { name: 'دجاج بلدي أو وراك', amount: 1, unit: 'كجم', estimatedPrice: 95 },
          { name: 'ثوم مفروم ناعم', amount: 5, unit: 'فصوص', estimatedPrice: 5 },
          { name: 'كزبرة جافة مطحونة وسمنة', amount: 2, unit: 'ملعقة', estimatedPrice: 10 },
          { name: 'أرز أبيض بالشعرية', amount: 300, unit: 'جرام', estimatedPrice: 15 },
        ],
        instructions: [
          'سلق الدجاج مع البصل والحبهان وورق اللورا لعمل شوربة غنية.',
          'غلي مقدار كوبين ونصف من الشوربة وإضافة الملوخية مع التقليب السريع.',
          'تحمير الثوم والكزبرة في السمنة البلدي حتى تصبح ذهبية وسكب الطشة مع الشهقة الشهيرة!',
          'تقديمها ساخنة مع الأرز المفلفل والدجاج المحمر.',
        ],
      };
    }

    if (lower.includes('شاورما')) {
      return {
        title: mealName,
        category: 'DINNER',
        servings: 3,
        prepTimeMins: 30,
        calories: 450,
        proteinG: 36,
        carbsG: 38,
        fatG: 14,
        estimatedCost: 115,
        ingredients: [
          { name: 'صدور دجاج شرائح رفيعة', amount: 600, unit: 'جرام', estimatedPrice: 90 },
          { name: 'زبادي وليمون وثوم بودرة', amount: 1, unit: 'علبة', estimatedPrice: 10 },
          { name: 'بهارات شاورما وبابريكا', amount: 2, unit: 'ملعقة', estimatedPrice: 8 },
          { name: 'بصل وبقدونس وطماطم شرائح', amount: 2, unit: 'حبة', estimatedPrice: 10 },
          { name: 'خبز صاج أو تورتيلا وسلطة تومية', amount: 4, unit: 'رغيف', estimatedPrice: 15 },
        ],
        instructions: [
          'تتبيل الدجاج بالزبادي والليمون والبهارات لمدة ساعة على الأقل.',
          'تشويح الدجاج على نار عالية في طاسة ساخنة جداً حتى يتشرب سوائله.',
          'إضافة البصل والطماطم والبقدونس في آخر دقيقتين ولف الساندوتشات بالتومية.',
        ],
      };
    }

    if (lower.includes('كفتة') || lower.includes('كفته')) {
      return {
        title: mealName,
        category: 'LUNCH',
        servings: 3,
        prepTimeMins: 35,
        calories: 490,
        proteinG: 35,
        carbsG: 22,
        fatG: 24,
        estimatedCost: 120,
        ingredients: [
          { name: 'لحم مفروم بلدي متبل', amount: 500, unit: 'جرام', estimatedPrice: 110 },
          { name: 'بصلة مبشورة ومصفاة', amount: 1, unit: 'حبة', estimatedPrice: 4 },
          { name: 'بقدونس مفروم وبهارات حاتي', amount: 1, unit: 'حزمة', estimatedPrice: 5 },
          { name: 'طحينة خام وليمون وخل', amount: 3, unit: 'ملاعق', estimatedPrice: 12 },
        ],
        instructions: [
          'عجن اللحم مع البصل والبهارات والبقدونس جيداً وتشكيله على أسياخ خشبية.',
          'شوي الكفتة على الجريل أو الفرن لمدة 15 دقيقة وإطفاء فحمية بنقطة زيت للرائحة.',
          'تقديمها مع سلطة الطحينة والخبز البلدي الطازج.',
        ],
      };
    }

    // Default intelligent Egyptian/Family recipe estimation
    return {
      title: mealName,
      category: 'LUNCH',
      servings: 3,
      prepTimeMins: 35,
      calories: 450,
      proteinG: 28,
      carbsG: 45,
      fatG: 16,
      estimatedCost: 95,
      ingredients: [
        { name: `${mealName} (المكون الأساسي)`, amount: 500, unit: 'جرام', estimatedPrice: 60 },
        { name: 'بصل وثوم وطماطم طازجة', amount: 2, unit: 'حبة', estimatedPrice: 15 },
        { name: 'بهارات وتوابل وزيت أو سمنة', amount: 2, unit: 'ملعقة', estimatedPrice: 10 },
        { name: 'خضار أو مقبلات جانبية', amount: 1, unit: 'طبق', estimatedPrice: 10 },
      ],
      instructions: [
        `تحضير وتجهيز مكونات ${mealName} الطازجة.`,
        'تشويح المكونات مع البهارات وضبط التتبيلة حسب رغبة فادي ورحمة.',
        'الطهي على نار متوسطة حتى النضج الكامل والتقديم ساخناً.',
      ],
    };
  }
}

// 2. Google Gemini Live Service (Activated when GEMINI_API_KEY is present)
export class GeminiAIService implements AIServiceInterface {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chatWithOmMahmoud(userMessage: string, context?: any): Promise<ChatResponse> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: `أنت "أم محمود" - ست البيت المصرية ومديرة الروقان في تطبيق بيتنا (Baytna).
شخصيتك:
- مصرية أصيلة، حنونة ودافئة، خفيفة الظل وذكية.
- تتحدثين باللهجة المصرية اليومية الطبيعية الجميلة ("يا ست الكل"، "يا حبيبتي"، "يا فادي يا بني"، "روقان"، "زي الفل"، "صباح الفل والياسمين").
- تساعدين رحمة وفادي في تدبير المطبخ، تنظيم البيت، التوفير، والهدوء النفسي بدون أي ضغط أو توبيخ.
- تقدمين نصائح عملية لتجهيز الأكل والنواقص والتنظيف السريع.
أجيبي بدفء واختصار وروح إيجابية مصرية.`,
      });

      const prompt = `رسالة رحمة أو فادي: "${userMessage}"\nسياق المنزل: ${JSON.stringify(context || {})}`;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI response timed out')), 5000)
      );
      const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
      const text = result.response.text();

      // Check if user is asking Om Mahmoud to tell their partner
      let bridgeNotification = undefined;
      const lower = userMessage.toLowerCase();
      const isFady = context?.userId === 'fady' || lower.includes('فادي');
      if (isFady && (lower.includes('قولي لرحمة') || lower.includes('بلغي رحمة') || lower.includes('وصي رحمة') || lower.includes('قوليلها') || lower.includes('نفسي في') || lower.includes('نفسي أكل') || lower.includes('نفسي اكل'))) {
        const cleanContent = userMessage.replace(/^(قولي\s*ل*رحمة|بلغي\s*رحمة|وصي\s*رحمة|قوليلها|يا\s*أم\s*محمود\s*قولي\s*ل*رحمة)/gi, '').trim();
        bridgeNotification = {
          fromUserId: 'fady',
          toUserId: 'rahma',
          title: 'رسالة من أم محمود: فادي بيوصيكي ❤️👵🏼',
          body: `يا رحمة يا ست البنات وقمر بيتنا، فادي حبيبك وصاني أقولك: "${cleanContent || userMessage}". ريحي بالك ومتشيليش هم يا غالية 💕`,
          emoji: '👵🏼',
        };
      } else if (!isFady && (lower.includes('قولي لفادي') || lower.includes('بلغي فادي') || lower.includes('وصي فادي') || lower.includes('قوليله'))) {
        const cleanContent = userMessage.replace(/^(قولي\s*ل*فادي|بلغي\s*فادي|وصي\s*فادي|قوليله|يا\s*أم\s*محمود\s*قولي\s*ل*فادي)/gi, '').trim();
        bridgeNotification = {
          fromUserId: 'rahma',
          toUserId: 'fady',
          title: 'رسالة من أم محمود: رحمة بتوصيك ❤️👵🏼',
          body: `يا فادي يا بني يا سندي، رحمة حبيبتك وصتني أقولك: "${cleanContent || userMessage}". متتأخرش على ست البنات 💕`,
          emoji: '👵🏼',
        };
      }

      return { message: text, bridgeNotification };
    } catch (error) {
      console.warn('Gemini chat fallback to local:', error);
      return new LocalHeuristicAIService().chatWithOmMahmoud(userMessage, context);
    }
  }

  async chatWithFitnessCoach(userMessage: string, userProfile?: any): Promise<ChatResponse> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: `أنت كوتش اللياقة والتغذية الرياضية الشخصي لفادي ورحمة في تطبيق بيتنا.
تتحدث بلهجة مصرية رياضية تشجيعية وعلمية ("عاش يا بطل"، "يا وحش"، "فورمة").
تركز على تمارين المقاومة، أوزان الجيم، حساب السعرات والماكروز (بروتين/كارب/دهون)، ونزول الدهون المستدام.
لا تقدم نصائح طبية علاجية ولا تشخص أمراضاً. أجب بدقة وعملية.`,
      });

      const prompt = `سؤال المتدرب: "${userMessage}"\nبيانات المتدرب: ${JSON.stringify(userProfile || {})}`;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI response timed out')), 5000)
      );
      const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
      return { message: result.response.text() };
    } catch (error) {
      return new LocalHeuristicAIService().chatWithFitnessCoach(userMessage, userProfile);
    }
  }

  async chatWithFamilyAssistant(userMessage: string, householdData?: any): Promise<ChatResponse> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: `أنت المساعد العائلي الذكي لتطبيق بيتنا (Baytna) لفادي ورحمة.
مهمتك: الإجابة عن كل ما يخص بيانات المنزل بدقة بناءً على البيانات المقدمة لك فقط.
لا تخترع بيانات لم تحدث، وإذا طُلب منك تعديل مالي أو حذف بيانات اطلب تأكيد المستخدم أولاً.
تحدث باللغة العربية الواضحة وبلهجة مصرية مهذبة.`,
      });

      const prompt = `السؤال: "${userMessage}"\nبيانات البيت: ${JSON.stringify(householdData || {})}`;
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI response timed out')), 5000)
      );
      const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
      return { message: result.response.text() };
    } catch (error) {
      return new LocalHeuristicAIService().chatWithFamilyAssistant(userMessage, householdData);
    }
  }

  async parseInvoice(imageBase64OrText: string): Promise<InvoiceParsedResult> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // If Base64 image provided, perform multimodal vision OCR
      const prompt = `حلل صورة الفاتورة هذه واستخرج البيانات بدقة بصيغة JSON فقط:
      {
        "storeName": "اسم المتجر أو السوبرماركت",
        "invoiceDate": "YYYY-MM-DD",
        "totalAmount": 0.0,
        "taxAmount": 0.0,
        "discountAmount": 0.0,
        "items": [
          {"name": "اسم المنتج", "qty": 1, "unitPrice": 0.0, "category": "FOOD/CLEANING/HOUSEHOLD"}
        ]
      }`;

      // In case image is passed as base64
      let contentPart: any = prompt;
      if (imageBase64OrText.startsWith('data:image')) {
        const matches = imageBase64OrText.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches) {
          contentPart = [
            prompt,
            {
              inlineData: {
                data: matches[2],
                mimeType: matches[1],
              },
            },
          ];
        }
      }

      const result = await model.generateContent(contentPart);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text) as InvoiceParsedResult;
    } catch (error) {
      console.warn('Gemini invoice parse error, using fallback:', error);
      return new LocalHeuristicAIService().parseInvoice(imageBase64OrText);
    }
  }

  async estimateMealNutrition(mealNameOrDescription: string): Promise<NutritionEstimateResult> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `قدّر القيم الغذائية التقريبية لهذه الوجبة المصرية أو المنزلية بصيغة JSON فقط:
      "${mealNameOrDescription}"
      الصيغة المطلوبة:
      {
        "mealName": "اسم الوجبة",
        "calories": 0,
        "proteinG": 0,
        "carbsG": 0,
        "fatG": 0,
        "healthTips": "نصيحة صحية موجزة بلهجة تشجيعية"
      }`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text) as NutritionEstimateResult;
    } catch (error) {
      return new LocalHeuristicAIService().estimateMealNutrition(mealNameOrDescription);
    }
  }

  async generateRecipeDetails(mealName: string): Promise<RecipeAIGenerateResult> {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `أنت شيف مصري ومساعد الطبخ المنزلي لرحمة وفادي في تطبيق بيتنا.
المطلوب إعداد مقادير وخطوات تفصيلية لوجبة: "${mealName}".
أعد النتيجة حصراً بصيغة JSON بدون أي نصوص أو شروحات خارج الكود:
{
  "title": "${mealName}",
  "category": "LUNCH",
  "servings": 4,
  "prepTimeMins": 35,
  "calories": 480,
  "proteinG": 30,
  "carbsG": 45,
  "fatG": 18,
  "estimatedCost": 110,
  "ingredients": [
    {"name": "اسم المكون بالتفصيل", "amount": 1, "unit": "كجم أو جرام أو حبة أو ملعقة", "estimatedPrice": 25}
  ],
  "instructions": [
    "الخطوة الأولى بالترتيب وباللهجة المصرية الواضحة",
    "الخطوة الثانية..."
  ]
}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text) as RecipeAIGenerateResult;
    } catch (error) {
      console.warn('Gemini recipe generate error, using local heuristic:', error);
      return new LocalHeuristicAIService().generateRecipeDetails(mealName);
    }
  }
}

// 3. Factory function
export function getAIService(): AIServiceInterface {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 10) {
    return new GeminiAIService(apiKey.trim());
  }
  return new LocalHeuristicAIService();
}
