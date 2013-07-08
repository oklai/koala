description "The blueprint framework for use with semantic markup."

stylesheet 'screen.sass', :media => 'screen, projection'
stylesheet 'partials/_base.sass'
stylesheet 'partials/_form.sass'
stylesheet 'partials/_page.sass'
stylesheet 'partials/_two_col.sass'
stylesheet 'print.sass',  :media => 'print'
stylesheet 'ie.sass',     :media => 'screen, projection', :condition => "lt IE 8"

image 'grid.png'

help %Q{
Please see the blueprint website for documentation on how blueprint works:

    http://blueprintcss.org/

Docs on the compass port of blueprint can be found on the wiki:

    http://wiki.github.com/chriseppstein/compass/blueprint-documentation
}

welcome_message %Q{
Please see the blueprint website for documentation on how blueprint works:

    http://blueprintcss.org/

Docs on the compass port of blueprint can be found on the wiki:

    http://wiki.github.com/chriseppstein/compass/blueprint-documentation

To get started, edit the screen.sass file and read the comments and code there.
}
