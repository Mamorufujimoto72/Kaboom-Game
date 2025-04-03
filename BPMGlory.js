kaboom({
    global: true,
    fullscreen: true,
    debug: true,
    
});
loadRoot("./")
loadSprite("Btile","BlackTile.png")
loadSprite("Wtile","WhiteTile.png")
loadSprite("Ptile","PurpleTile.png")
loadSprite("Rtile","RedTile.png")
loadSprite("Track","Track.png")

scene("main", () => {
    const SPEED = 90
    
    add([
        "Track",
        sprite("Track"),
        anchor("bot"),
        pos(width()/2,height()),
        scale(10)
    ])

    loop(0.5, () => {

        add([
            sprite("Btile"),
            pos(width(), rand(10, 100)),
        ])

})
action("Btile", (o) => {
    o.move(-SPEED * speedMod, 0)
    if(o.pos.x <= -width())
        destroy(o)
}

})
go("main")  