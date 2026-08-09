## Internationalisation

```dart
class AppTranslations extends Translations {
  @override
  Map<String, Map<String, String>> get keys => {
    'en_US': {
      'hello': 'Hello',
      'welcome': 'Welcome, @name',
      'item': 'item',
      'items': 'items',
    },
    'pt_BR': {
      'hello': 'Olá',
      'welcome': 'Bem-vindo, @name',
      'item': 'item',
      'items': 'itens',
    },
  };
}

GetMaterialApp(
  translations: AppTranslations(),
  locale: const Locale('en', 'US'),
  fallbackLocale: const Locale('en', 'US'),
)
```

```dart
'hello'.tr                                       // 'Hello'
'welcome'.trParams({'name': 'Viraj'})            // 'Welcome, Viraj'
'item'.trPlural('items', controller.count.value) // '3 items'

// Change locale at runtime
Get.updateLocale(const Locale('pt', 'BR'));
```

---
