# Proguard rules for VyaparBook PWA Wrapper
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
