# Onboarding

Three steps before the existing RevenueCat offering `default`: interactive translation example, spaced repetition, full-access benefits.

`OnboardingGate` wraps the navigator, so direct routes cannot skip the subscription check. The local key `dashword:onboarding:v1` only remembers that the introduction was completed; it never grants paid access. Existing active subscribers skip the introduction. Closing the paywall without active `plus` leaves the access screen visible. Restore is available throughout. Returning non-subscribers see the final access step without repeating the introduction.

The existing development preview exception (web / Expo Go in development only) remains: completing onboarding opens the app without native purchases. Native builds use RevenueCat. Price and trial eligibility are displayed by the remotely configured paywall, not hardcoded in onboarding.

Verified: TypeScript, lint, five subscription access unit tests; browser walkthrough of all three steps, correct-answer feedback, completion and persistence after reload in development web.

Still requires native QA: eligible trial, purchase cancellation, restoration, offline failure, renewal/expiry, small phone and large accessibility text. Confirm the published RevenueCat paywall has working privacy and terms links.
