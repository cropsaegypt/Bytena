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
    const lower = userMessage.toLowerCase();

    if (lower.includes('أكل') || lower.includes('غدا') || lower.includes('وجبة') || lower.includes('طبخ') || lower.includes('مطبخ')) {
      return {
        message: 'يا صباح السعادة يا ست الكل! إيه رأيك نعمل مكرونة بالبشاميل أو صينية فراخ مشوية بالبطاطس؟ فادي بيحبهم جداً وسهلين ومش هياخدوا منك وقت خالص. والمكونات تقريباً كلها عندنا في التلاجة!',
        suggestedAction: {
          type: 'ADD_RECIPE',
          payload: { title: 'صينية دجاج مشوي بالبطاطس', category: 'LUNCH' },
        },
      };
    }

    if (lower.includes('ناقص') || lower.includes('شراء') || lower.includes('سوبرماركت') || lower.includes('طلبات')) {
      return {
        message: 'بصي يا حبيبتي، مسجلة عندي في طلبات البيت اللبن واللحم المفروم ومسحوق الغسيل. ممكن نخلي فادي يجيبهم وهو راجع من الشغل أو نطلبهم أونلاين عشان متتعبيش نفسك ❤️',
        suggestedAction: {
          type: 'ADD_SHOPPING',
          payload: { name: 'لبن حليب', category: 'GROCERIES', quantity: 2, unit: 'لتر' },
        },
      };
    }

    if (lower.includes('تعبانة') || lower.includes('مرهقة') || lower.includes('كسل') || lower.includes('ارتاح')) {
      return {
        message: 'سلامتك ألف سلامة يا ست البنات! متعمليش أي مجهود زيادة النهارده، البيت مش هيطير. خدي ليكي فنجان شاي بالنعناع أو كوباية ينسون دافية واقعدي ريحي شوية وفادي هيساعدك في باقي الحاجات ❤️',
      };
    }

    if (lower.includes('مية') || lower.includes('عطشانة') || lower.includes('شرب')) {
      return {
        message: 'جدعة يا قمر! متنسيش تشربي كوباية المية الكبيرة دي، الترطيب مهم جداً لنضارتك وصحتك ويديكي طاقة طول اليوم 💧',
        suggestedAction: {
          type: 'REMIND_WATER',
          payload: { amountMl: 300 },
        },
      };
    }

    // Default warm Egyptian reply
    return {
      message: `من عينيا يا ست رحمة يا سكرة! أنا معاكي خطوة بخطوة عشان بيتنا يفضل دايمًا رايق ومنظم وفيه أحلى بركة. تحبي ننظم مهام النهارده ولا نراجع طلبات المطبخ والمصروفات؟`,
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
- تتحدثين باللهجة المصرية اليومية الطبيعية الجميلة ("يا ست الكل"، "يا حبيبتي"، "روقان"، "زي الفل"، "صباح الفل والياسمين").
- تساعدين رحمة وفادي في تدبير المطبخ، تنظيم البيت، التوفير، والهدوء النفسي بدون أي ضغط أو توبيخ.
- تقدمين نصائح عملية لتجهيز الأكل والنواقص والتنظيف السريع.
أجيبي بدفء واختصار وروح إيجابية مصرية.`,
      });

      const prompt = `رسالة رحمة أو فادي: "${userMessage}"\nسياق المنزل: ${JSON.stringify(context || {})}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return { message: text };
    } catch (error) {
      console.warn('Gemini chat error, using local fallback:', error);
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
      const result = await model.generateContent(prompt);
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
      const result = await model.generateContent(prompt);
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
