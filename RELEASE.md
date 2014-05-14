# Updates

* Removes the `Unable to retrieve RTC Session ID.`

# Purpose
This release is primarily meant for use by members of SVT team.

The sample web application shipped with this package can be used as a utility by SVT team members to execute SVT test use cases in scope for SVT1-MVP1.

JS SDK support team formally supports any defects raised by SVT team for:
* Any problems using this package (obtaining, deploying, configuring)
* Any functional issues with sample application behavior in SVT1-MVP1 scope

**This is not a Beta or GA release**

Using this package for other general purposes is also encouraged but cannot be formally supported by JS SDK delivery team. Please use it at your own risk.

Any feedback to improve the product is highly appreciated. Please communicate with your support contact to provide any feedback.

# Features
* Functional:
  * Detect browser support for WebRTC
  * Login & Logout AT&T Subscriber (ICMN)
  * Create E911 ID by obtaining user's Address
* Technical:
  * JS API (callbacks) to attach Developer-defined functionality for above functions
  * Logging and Error Handling

# Limitations
* Environment: The SDK was tested against F6 UAT.

This release is tested on following environments. It may also work for other versions of O/S, Browser and NodeJS but is not tested or supported.

* Chrome v34.0.1847.131 for OSX v10.8.5
* Firefox v28.0 for OSX v10.8.5
* NodeJS v0.10.26 on Mac OS X v10.8.5
