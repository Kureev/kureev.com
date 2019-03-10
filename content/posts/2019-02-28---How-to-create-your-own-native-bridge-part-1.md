---
title: How to create your own native bridge
date: "2016-09-29"
template: "post"
draft: false
slug: "/posts/how-to-create-your-own-native-bridge-part-1/"
category: "Coding"
tags:
  - "Coding"
  - "React Native"
description: "I’ve been using React Native for a while before I started to dive into the codebase to see how it works. Since then I’ve made quite a few contributions to the project and even managed to become a part of react-native core team.

Although, one part of the project was truly mystical to me — how it bridges two different languages: JavaScript and Objective C. This lack of understanding gave me the motivation to do some research on the bridge and document my findings in these articles."
---

<img src="/media/how-to-create-your-own-bridge-1/header.png" alt="Two pirate ships (JavaScript and Objective C) with a bridge between them" />

I’ve been using React Native for a while before I started to dive into the codebase to see how it works. Since then I’ve made quite a few contributions to the project and even managed to become a part of react-native core team.

Although, one part of the project was truly mystical to me — how it bridges two different languages: JavaScript and Objective C. This lack of understanding gave me the motivation to do some research on the bridge and document my findings in these articles.

No doubt, it is pointless to write code without having a clear mental picture of the finished product (or a milestone). Architectural design is an important step of software development. I will try to guide you through the thought process and explain in detail what decisions were made and why.

First iteration
When you start a new project, it makes sense to determine a list of technologies you’re going to use. In my case they were:

Objective C to manipulate Cocoa UI
C++ to work with JSVM
JSVM (V8 or Chakra)
JavaScript
React + custom renderer
I assumed my main executable will be written in C++. It will run a JS engine with a patched global context (all major JS engines provides you a possibility to extend their built-in functionality by custom objects/functions). Don’t be afraid of “patched global context”, it means nothing but adding a few new functions written in C++ to your JS environment. Later on, we will talk about it in details.

Once we call one of these custom JS functions, it goes through the JSVM (JavaScript Virtual Machine) and invokes a C++ implementation, which in turn, triggers the Objective C code to construct a UI element. It may sound a bit complex, but don’t give up yet!

All these things can be run in the same (main) thread, but it’ll cause certain performance issues. To avoid that, we dedicate a new thread to handle Objective C ↔ UI jobs.

Even though this approach makes sense, it doesn’t work.

The problem is that Apple doesn’t allow you to render your UI in non-main thread. Moreover, if UI can be rendered only in the main thread, it means that Objective C should be run in the same thread as well. Unfortunately, this approach ties your application’s entry point to the platform (or, at least, makes it really complicated to run it on the other platforms). But we have what we have. Let’s change our initial approach to fit this requirement.

Corrections
If we have to run a UI in the main thread, let’s do it! Instead of running a C++ program, we run a Cocoa application. When its bootstrapped, we spawn a new background thread with a JSVM on board. JSVM runs the main JavaScript file (your bundle) in order to get instructions to execute. As in the previous approach, if you have any proxied C++ functions in your JS code, JSVM will take care of them. Once one of those functions is called, it sends a command to the main thread to draw UI.

In the main thread, Objective C process is given a command and renders an appropriate interface element for it. If there are no errors, Objective C triggers a callback that has been passed in from C++ in order to call a function representing a callback from JS.

Final architecture
Now, let’s try to combine all these together:

We start a native Cocoa Application because we need to run UI in the main thread.
Right at the moment when our blank application is bootstrapped, we create a new thread with JSVM. Once it’s done, we run JavaScript. As I said above, we patch our JSVM context and expose some additional APIs to manipulate the user interface layer.
Once we receive a command from JS to draw UI, we dispatch it to Objective C. In it’s turn, Objective C parses the command and renders appropriate UI elements.
After that, Objective C invokes a sequence of callbacks in order to pass a return value to JS.
Building a platform foundation
Time for the hands on experience! First of all, let’s create a blank OS X Cocoa Application:

Mac OS X Cocoa Application creation window
Once this step is done, you have your foundation. Now, if you open your AppDelegate.m, you will find two application lifetime hooks: applicationDidFinishLaunching and applicationWillTerminate. Our application should spawn a new thread at the moment of creation, so let’s change our applicationDidFinishLaunching to do the trick:

Thread creation in the applicationDidFinishLaunching hook
Now I have to answer two questions:

What is a \_jsvmThread variable?
What does @selector(runJSVMThread) mean?
\_jsvmThread is nothing else but an instance variable that stores a reference to our new NSThread. We need this reference in order to execute our C++ callbacks in the proper thread.

Selector, according to Apple’s docs, is the name used to select a method to execute for an object, or the unique identifier that replaces the name when the source code is compiled.

In other words, we initialize a new NSThread and run runJSVMThread method of object self (which points to the current instance of the class) in it.

Here’s the body of runJSVMThread method:

The way how we run a JSVM (ChakraCore)
As you can see, I decided to use ChakraCore instead of V8. There are some reasons for that:

It took me 1 hour to compile V8 and 2 hours to run HelloWorld example
ChakraCore took me 10 mins to compile and run HelloWorld example
Side note: since we’re building a prototype, I would prefer better developer experience that I have with ChakraCore.

Right after ChakraProxy initialization we have a run loop. We use it here to keep our thread alive (otherwise it’ll die after run function is finished). If you want to know more about run loops, Apple docs is a good place to start.

Now we have an application that starts, spawns a new thread and waits for commands. Next step would be to define a ChakraProxy class.

ChakraProxy is just a container which encapsulates Objective C and C++ code:

ChakraProxy class skeleton
Of course, this code doesn’t do anything handy yet, but gives you a room to maneuver. In the next chapter we’ll add some fancy things like ChakraCore, basic bridging model and way, way more.

In the meanwhile, you can play with the code in my github repository.

Want to know more about runtimes, contexts, scopes and their implementation? Or maybe extend idiomatic JavaScript by adding your own C++ functions?

All these and even more awaits you in the Chapter 2: JSVM and the first adventure.
