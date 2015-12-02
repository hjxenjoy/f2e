# Javascript 面向对象

> 为了讲清楚jQuery的原理，我需要说下Javascript（下面全部使用JS代替）的面向对象的知识。此为背景。

## JS的两种对象声明方式

1. `new Object()`方式
2. `new func()`方式

## 前言

在说正题之前，先讲几个名词：

* **类/静态方法和属性**
    
比如JS的各种内置对象 `Object String Number Boolean Array RegExp Function`

那么使用如下的方式来调用的方法就叫静态方法

```js
Object.toString();
// "function Object() { [native code] }"
```

同理，调用的属性就叫做静态属性，而JS的这些内置对象就可以被看作是面向对象语言中的类

* **实例对象/原型方法和属性**

比如JS定义的对象、方法、字符串、数字、数组、正则表达式等等

那么使用如下的方式来调用的方法就叫做原型方法、或者叫实例方法，调用的属性就是对应的原型属性/实例属性

```js
var array = new Array('a', 'b', 'c');
array.join(',');
// "a,b,c"

array.length;
// 3
```

那么二者的区别是什么呢？

实例对象是通过`new`关键字创建的对应类的对象。就像`人`是一个类，韩梅梅是一个`人`的实例对象，韩梅梅有属性：性别、年龄，有方法：说学逗唱。

**那么为什么实例化了一个对象， 这个对象就会有了那些属性和方法呢？那么些方法和属性是从哪儿来？**

因为JS中类有一个对象属性叫做`prototype`，不同的类的`prototype`属性对象里所包含的属性不同，而`prototype`里所有的方法都是为实例化对象所准备的。

比如`Array.prototype`对象里有方法：`join concat`等，所以实例化的一个数组才能调用那些方法。

同样，可以给`prototype`扩展方法，这样对应类的实例对象也就相应了具备了新扩展的方法。

## JS声明对象的方式一：new  Object()

```js
var object1 = new Object();
var object2 = {};

var array1 = new Array();
var array2 = [];
```

上面方法的两种声明对象和数组的作用相同，最后实例化出来的实例对象都具备了Object/Array的`prototype`(原型)的方法和属性。

## JS声明对象的方式二： new func()

> 为什么要写func，而不是function 不是Function 不是其他别的字符串？为了告诉你，func是一个方法。下面看代码！

```js
function person(person_name) {
    this.name = person_name;
}

person('Han Meimei');               // 1

var lilei = new person('Li Lei');   // 2

```

显然，一个方法，完全可以通过直接的调用的方式来生效。那么调用1的结果应该是：

`window.name ==> 'Han Meimei'`

而`new`关键字可以给一个方法进行实例化，当使用`new`来调用一个方法的时候，方法体内的`this`就不再是之前我们说的上下文，不再是我们说的谁调用他谁才是`this`。

那么此时的`this`是谁？是实例化对象，是`prototype`！

所以调用2的结果是：

`lilei.name ==> 'Li Lie'`

**文章的开始，我们使用Object.toString()时发现Object其实也是一个方法，同理，所有的JS内置对象全部都是方法，所以它们都可以使用new的方式来创建一个实例化的对象。**

我们发现`new Function()`的值也是一个function（方法/函数），别的内置对象的实例化不是一个function，所以别的内置对象的实例化对象不能再次实例化，而我们自己定义的function却可以再次进行实例化。

此时给一个自己定义的function进行new操作时，返回的就是一个Object实例对象了，就再不能重复实例化了。

正因为这个特质，我们才可以在JS里创建一个个自定义的类，然后来创建它的实例。

## 自定义类和prototype的使用

既然可以自定义一个类了，那么如何来操作呢？一般定一个类，会默认把首字母大写。

```js
function Person(name, age, gender) {
    this.name = name;
    this.age = age;
    this.gender = gender;
}

Person.prototype.say = function (words) {
    console.log(this.name + '说%s', words);
};

var lilei1 = new Person('李雷', 28, '男');

lilei1.say('你好');
// ==> 李雷说你好
```

上面使用给原型prototype**扩展**方法的方式来增加实例方法。下面我们使用**重写** prototype的方法来构造实例方法。

```js
function Person(name, age, gender) {
    this.name = name;
    this.age = age;
    this.gender = gender;
}

Person.prototype = {
    introduce: function () {
        console.log('大家好，我叫%s，%s，今年%d岁。', this.name, this.gender, this.age);
    },
    say: function (words) {
        console.log(this.name + '说%s', words);
    }
};

var lilei2 = new Person('李雷', 28, '男');

lilei2.introduce();
// ==> 大家好，我叫李雷，男，今年28岁。

lilei2.say('你好');
// ==> 李雷说你好
```

那么**扩展**和**重写**的区别是什么呢？

显而易见的一点是：前者保留了原来的prototype所带的方法和属性，而后者直接推倒重来，以前的一切不复存在！

这是浅层次的，那么深层次的区别呢？

此时constructor属性登场！

## constructor 与 prototype 

constructor，顾名思义，构造者，它代表原型实例的构造函数是谁？

```js
var str = 'abc';
var num = 123;
var bool = true;
var obj = {};
var func = function () {};

str.constructor     // function String() { [native code] }
num.constructor     // function Number() { [native code] }
bool.constructor    // function Boolean() { [native code] }
obj.constructor     // function Object() { [native code] }
func.constructor    // function Function() { [native code] }
```

显然，它们的构造者是它们的类！

那么上面两种修改prototype的方式出来的lilei的constructor是谁呢？

```js
// 扩展的方式时：
lilei1.constructor // function Person(name, age, gender) {...}

// 重写的方式时：
lilei2.constructor // function Object() { [native code] }
```

很明显的看出了区别！也就是，**当我们new一个function的时候，这个function的prototype自带了一个属性，它是constructor，它指向了这个function**

那么这个constructor指向有什么作用呢？其实我也不大清楚……只是在使用`instanceof`时发现了不一样：

`instanceof`是用来判断一个对象是否一个类创建的实例的操作符。

比如：

```js
var array = [];
array instanceof Array // true
```

> 但是要提出的是：当你使用简单的字符串、数字、true/false时，使用instanceof返回的是false，而使用new String()、new Number()、new Boolean()出来的实例使用instanceof返回的是true

而此时再测试一下两种修改原型prototype方式的instanceof的差异

```js
lilei1 instanceof Person // true
lilei2 instanceof Person // false
```

差异出来了，明明lilei2也是Person创建出来的实例，最后想匹配确认下的时候，却不认识了！

这就是在**重写**一个的prototype的时候一个注意问题。所以我们在写第二种原型的修改方式时，需要这么写：

```js
function Person(name, age, gender) {
    this.name = name;
    this.age = age;
    this.gender = gender;
}

Person.prototype = {
    constructor: Person,

    introduce: function () {
        console.log('大家好，我叫%s，%s，今年%d岁。', this.name, this.gender, this.age);
    },
    say: function (words) {
        console.log(this.name + '说%s', words);
    }
};

var lilei2 = new Person('李雷', 28, '男');

lilei2 instanceof Person // true
```

## 结束语

区分了类和实例对象的差异，弄懂了prototype的恩恩怨怨，JAVASCRIPT的面向对象就基本掌握了。
